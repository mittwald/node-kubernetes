import request from "request";
import {IKubernetesClientConfig} from "./config";
import {Selector, selectorToQueryString} from "./label";
import {isStatus, MetadataObject} from "./types/meta";
import {DeleteOptions, WatchEvent} from "./types/meta/v1";
import {redactResponseBodyForLogging} from "./security";

const debug = require("debug")("kubernetes:client");

export type RequestMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";

export type SelectorOptions = {
    labelSelector?: Selector;
    fieldSelector?: Selector;
};

export type MandatorySelectorOptions =
    | {labelSelector: Selector}
    | {fieldSelector: Selector};

export type WatchOptions = SelectorOptions & {
    resourceVersion?: number;
    abortAfterErrorCount?: number;
    resyncAfterIterations?: number;
    onError?: (err: any) => void;
    onEstablished?: () => void;
};

export type ListOptions = SelectorOptions;

export interface WatchResult {
    resourceVersion: number;
    resyncRequired?: boolean;
}

export const patchKindStrategicMergePatch = "application/stategic-merge-patch+json";
export const patchKindMergePatch = "application/merge-patch+json";
export const patchKindJSONPatch = "application/json-patch+json";
export type PatchKind =
    | typeof patchKindStrategicMergePatch
    | typeof patchKindMergePatch
    | typeof patchKindJSONPatch;

export interface IKubernetesRESTClient {
    post<R = any>(url: string, body: any): Promise<R>;
    put<R = any>(url: string, body: any): Promise<R>;
    patch<R = any>(url: string, body: any, patchKind: PatchKind): Promise<R>;
    delete<R = any>(url: string, opts?: DeleteOptions, queryParams?: {[k: string]: string}, body?: any): Promise<R>;
    get<R = any>(url: string, opts?: ListOptions): Promise<R|undefined>;
    watch<R extends MetadataObject = MetadataObject>(url: string, onUpdate: (o: WatchEvent<R>) => any, onError: (err: any) => any, opts?: WatchOptions): Promise<WatchResult>;
}

const joinURL = (left: string, right: string) => (left + "/" + right).replace(/([^:])(\/\/)/g, "$1/");

export class KubernetesRESTClient implements IKubernetesRESTClient {

    public constructor(private config: IKubernetesClientConfig) {
    }

    private request<R = any>(url: string, body?: any, method: RequestMethod = "POST", additionalOptions: request.CoreOptions = {}): Promise<R> {
        const absoluteURL = joinURL(this.config.apiServerURL, url);

        return new Promise((res, rej) => {
            let opts: request.OptionsWithUrl = {
                method,
                url: absoluteURL,
                json: true,
            };

            if (body) {
                opts.json = body;
            }

            opts = this.config.mapRequestOptions(opts);

            if (additionalOptions.headers) {
                additionalOptions.headers = {...(opts.headers || {}), ...additionalOptions.headers};
            }

            opts = {...opts, ...additionalOptions};

            debug(`executing ${method} request on ${opts.url}`);

            request(opts, (err, response, responseBody) => {
                if (err) {
                    rej(err);
                    return;
                }

                if (isStatus(responseBody) && responseBody.status === "Failure") {
                    rej(new Error(responseBody.message));
                    return;
                }

                debug(`${method} request on ${opts.url} succeeded with status ${response.statusCode}: ${redactResponseBodyForLogging(responseBody)}`);
                res(responseBody);
            });
        });
    }

    public post<R = any>(url: string, body: any): Promise<R> {
        return this.request<R>(url, body, "POST");
    }

    public put<R = any>(url: string, body: any): Promise<R> {
        return this.request<R>(url, body, "PUT");
    }

    public patch<R = any>(url: string, body: any, patchKind: PatchKind): Promise<R> {
        return this.request<R>(url, body, "PATCH", {headers: {
            "Content-Type": patchKind,
        }});
    }

    public delete<R = any>(url: string, deleteOptions?: ListOptions, queryParams: {[k: string]: string} = {}, body?: any): Promise<R> {
        const opts: request.CoreOptions = {};

        opts.qs = queryParams;

        if (deleteOptions && deleteOptions.labelSelector) {
            opts.qs.labelSelector = selectorToQueryString(deleteOptions.labelSelector);
        }

        if (deleteOptions && deleteOptions.fieldSelector) {
            opts.qs.fieldSelector = selectorToQueryString(deleteOptions.fieldSelector);
        }

        return this.request<R>(url, body, "DELETE", opts);
    }

    public watch<R extends MetadataObject = MetadataObject>(url: string,
                                                            onUpdate: (o: WatchEvent<R>) => any,
                                                            onError: (err: any) => any,
                                                            watchOpts: WatchOptions = {}): Promise<WatchResult> {
        const absoluteURL = joinURL(this.config.apiServerURL, url);

        let opts: request.OptionsWithUrl = {
            url: absoluteURL,
            qs: {watch: "true"},
        };

        if (watchOpts.labelSelector) {
            opts.qs.labelSelector = selectorToQueryString(watchOpts.labelSelector);
        }

        if (watchOpts.fieldSelector) {
            opts.qs.fieldSelector = selectorToQueryString(watchOpts.fieldSelector);
        }

        if (watchOpts.resourceVersion) {
            opts.qs.resourceVersion = watchOpts.resourceVersion;
        }

        opts = this.config.mapRequestOptions(opts);
        opts.headers = {...opts.headers, "Connection": "keep-alive", "Accept": "application/json"};

        let lastVersion: number = watchOpts.resourceVersion || 0;

        debug(`executing WATCH request on ${absoluteURL} (starting revision ${lastVersion})`);

        return new Promise<WatchResult>((res, rej) => {
            const req = request(opts, async (err, response, bodyString) => {
                if (err) {
                    debug(`%o request on %o failed: %O`, "WATCH", opts.url, err);

                    rej(err);
                    return;
                }

                debug(`%o request on %o completed with status %o: %O`, "WATCH", opts.url, response.statusCode, bodyString);

                if (response.statusCode && response.statusCode >= 400) {
                    if (response.statusCode === 410) {
                        debug(`last known resource has expired -- resync required`);
                        res({resourceVersion: lastVersion, resyncRequired: true});
                        return;
                    }

                    rej(new Error("Unexpected status code: " + response.statusCode));
                    return;
                }

                if (bodyString.length === 0) {
                    debug(`WATCH request on ${url} returned empty response`);
                    res({resourceVersion: lastVersion});
                    return;
                }

                let body: any;

                try {
                    body = JSON.parse(bodyString);
                } catch (err) {
                    const bodyLines = bodyString.split("\n");
                    for (const line of bodyLines) {
                        if (line === "") {
                            continue;
                        }

                        try {
                            const parsedLine: WatchEvent<R> = JSON.parse(line);
                            if (parsedLine.type === "ADDED" || parsedLine.type === "MODIFIED" || parsedLine.type === "DELETED") {
                                const resourceVersion = parseInt(parsedLine.object.metadata.resourceVersion || "0", 10);
                                if (resourceVersion > lastVersion) {
                                    debug(`watch: emitting missed ${parsedLine.type} event for ${parsedLine.object.metadata.name}`);

                                    lastVersion = resourceVersion;
                                    await onUpdate(parsedLine);
                                }
                            }
                        } catch (err) {
                            debug(`watch: could not parse JSON line '${line}'`);

                            rej(err);
                            return;
                        }
                    }
                    res({resourceVersion: lastVersion});
                    return;
                }

                if (isStatus(body) && body.status === "Failure") {
                    debug(`watch: failed with status %O`, body);
                    rej(body.message);
                    return;
                }

                res({resourceVersion: lastVersion});
            });

            let buffer = "";

            req.on("request", r => {
                debug("sending WATCH request on %o: %o", opts.url, r.getHeaders());
            })

            req.on("response", response => {
                debug("got response to WATCH request on %o: %o", opts.url, response.request.headers);
                if (watchOpts.onEstablished) {
                    watchOpts.onEstablished();
                }
            });

            req.on("data", async chunk => {
                if (chunk instanceof Buffer) {
                    chunk = chunk.toString("utf-8");
                }

                debug("WATCH request on %o received %d bytes of data", opts.url, chunk.length);
                buffer += chunk;

                try {
                    const obj: WatchEvent<R> = JSON.parse(buffer);
                    buffer = "";

                    const resourceVersion = obj.object.metadata.resourceVersion ? parseInt(obj.object.metadata.resourceVersion, 10) : -1;
                    if (resourceVersion > lastVersion) {
                        debug(`watch: emitting ${obj.type} event for ${obj.object.metadata.name}`);

                        lastVersion = resourceVersion;
                        await onUpdate(obj);
                    }
                } catch (err) {
                    onError(err);
                }
            });
        });
    }

    public get<R = any>(url: string, listOptions: ListOptions = {}): Promise<R|undefined> {
        const absoluteURL = joinURL(this.config.apiServerURL, url);
        const {labelSelector, fieldSelector} = listOptions;

        return new Promise<R|undefined>((res, rej) => {
            let opts: request.OptionsWithUrl = {
                url: absoluteURL,
                qs: {},
            };

            if (labelSelector) {
                opts.qs.labelSelector = selectorToQueryString(labelSelector);
            }

            if (fieldSelector) {
                opts.qs.fieldSelector = selectorToQueryString(fieldSelector);
            }

            opts = this.config.mapRequestOptions(opts);

            debug(`executing GET request on ${opts.url}`);

            request(opts, (err, response, body) => {
                if (err) {
                    rej(err);
                    return;
                }

                if (response.statusCode === 404) {
                    debug(`GET request on %o failed with status %o`, opts.url, response.statusCode);

                    res(undefined);
                    return;
                }

                try {
                    body = JSON.parse(body);
                } catch (err) {
                    rej(err);
                    return;
                }

                if (isStatus(body) && body.status === "Failure") {
                    if (body.code === 404) {
                        res(undefined);
                        return;
                    }

                    debug(`executing GET request on %o failed. response body: %O`, response.statusCode, body);

                    rej(new Error(body.message));
                    return;
                }

                debug(`GET request on %o succeeded with status %o: %O`, opts.url, response.statusCode, body);
                res(body);
            });
        });
    }

}
