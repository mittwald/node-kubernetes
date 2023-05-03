import {IKubernetesClientConfig} from "./config";
import {Selector, selectorToQueryString} from "./label";
import {isStatus, MetadataObject} from "./types/meta";
import {DeleteOptions, WatchEvent} from "./types/meta/v1";
import {redactResponseBodyForLogging} from "./security";
import axios, {AxiosRequestConfig} from "axios";
import * as http2 from "http2";
import {SecureClientSessionOptions} from "http2";
import qs from "qs";

const debug = require("debug")("kubernetes:client");

export type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type SelectorOptions = {
    labelSelector?: Selector;
    fieldSelector?: Selector;
};

export type MandatorySelectorOptions =
    | { labelSelector: Selector }
    | { fieldSelector: Selector };

export type WatchOptions = SelectorOptions & {
    resourceVersion?: number;
    abortAfterErrorCount?: number;
    resyncAfterIterations?: number;
    onError?: (err: any) => void;
    onEstablished?: () => void;
    pingIntervalSeconds?: number;
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

    delete<R = any>(url: string, opts?: DeleteOptions, queryParams?: { [k: string]: string }, body?: any): Promise<R>;

    get<R = any>(url: string, opts?: ListOptions): Promise<R | undefined>;

    watch<R extends MetadataObject = MetadataObject>(url: string, onUpdate: (o: WatchEvent<R>) => any, onError: (err: any) => any, opts?: WatchOptions): Promise<WatchResult>;
}

const joinURL = (left: string, right: string) => (left + "/" + right).replace(/([^:])(\/\/)/g, "$1/");

export class KubernetesRESTClient implements IKubernetesRESTClient {

    public constructor(private config: IKubernetesClientConfig) {
    }

    private async request<R = any>(url: string, body?: any, method: RequestMethod = "POST", additionalOptions: AxiosRequestConfig = {}): Promise<R> {
        const absoluteURL = joinURL(this.config.apiServerURL, url);

        let opts: AxiosRequestConfig = {
            method,
            url: absoluteURL,
            responseType: "json",
        };

        if (body) {
            opts.data = body;
        }

        opts = this.config.mapAxiosOptions(opts);

        if (additionalOptions.headers) {
            additionalOptions.headers = {...(opts.headers || {}), ...additionalOptions.headers};
        }

        opts = {...opts, ...additionalOptions};

        debug(`executing ${method} request on ${opts.url}`);

        const response = await axios(opts);
        const responseBody = response.data;

        if (isStatus(responseBody) && responseBody.status === "Failure") {
            throw new Error(responseBody.message);
        }

        debug(`${method} request on ${opts.url} succeeded with status ${response.status}: ${redactResponseBodyForLogging(responseBody)}`);
        return responseBody;
    }

    public post<R = any>(url: string, body: any): Promise<R> {
        return this.request<R>(url, body, "POST");
    }

    public put<R = any>(url: string, body: any): Promise<R> {
        return this.request<R>(url, body, "PUT");
    }

    public patch<R = any>(url: string, body: any, patchKind: PatchKind): Promise<R> {
        return this.request<R>(url, body, "PATCH", {
            headers: {
                "Content-Type": patchKind,
            }
        });
    }

    public delete<R = any>(url: string, deleteOptions?: ListOptions, queryParams: { [k: string]: string } = {}, body?: any): Promise<R> {
        const opts: AxiosRequestConfig = {};

        opts.params = queryParams;

        if (deleteOptions && deleteOptions.labelSelector) {
            opts.params.labelSelector = selectorToQueryString(deleteOptions.labelSelector);
        }

        if (deleteOptions && deleteOptions.fieldSelector) {
            opts.params.fieldSelector = selectorToQueryString(deleteOptions.fieldSelector);
        }

        return this.request<R>(url, body, "DELETE", opts);
    }

    public watch<R extends MetadataObject = MetadataObject>(
        url: string,
        onUpdate: (o: WatchEvent<R>) => any,
        onError: (err: any) => any,
        watchOpts: WatchOptions = {},
    ): Promise<WatchResult> {
        const absoluteURL = joinURL(this.config.apiServerURL, url);
        const params: Record<string, string> = {watch: "true"};
        const {pingIntervalSeconds = 15} = watchOpts;

        if (watchOpts.labelSelector) {
            params.labelSelector = selectorToQueryString(watchOpts.labelSelector);
        }

        if (watchOpts.fieldSelector) {
            params.fieldSelector = selectorToQueryString(watchOpts.fieldSelector);
        }

        if (watchOpts.resourceVersion) {
            params.resourceVersion = `${watchOpts.resourceVersion}`;
        }

        let clientPingInterval: NodeJS.Timeout | undefined;

        const clientOpts: SecureClientSessionOptions = this.config.mapNativeOptions({});
        const client = http2.connect(this.config.apiServerURL, clientOpts, (session, socket) => {
            clientPingInterval = setInterval(() => {
                session.ping((err, duration) => {
                    if (err) {
                        debug("error on HTTP/2 client ping: %O", err);
                        session.destroy(err);
                    }
                });
            }, pingIntervalSeconds * 1000);
        });

        let lastVersion: number = watchOpts.resourceVersion || 0;

        debug(`executing WATCH request on ${absoluteURL} (starting revision ${lastVersion})`);

        return new Promise<WatchResult>((res, rej) => {
            const requestHeaders = {
                [http2.constants.HTTP2_HEADER_METHOD]: "GET",
                [http2.constants.HTTP2_HEADER_PATH]: url + "?" + qs.stringify(params),
                [http2.constants.HTTP2_HEADER_ACCEPT]: "application/json",
                ...this.config.mapHeaders({}),
            };
            const request = client.request(requestHeaders);

            let body = "";
            let buffer = "";

            request.on("error", (err: any) => {
                debug(`watch: error: %O`, err);
                rej(err);
            });

            request.on("response", (headers, flags) => {
                const status = headers[":status"];
                debug(`%o request on %o completed with status %o`, "WATCH", absoluteURL, status);

                if (status && status >= 400) {
                    if (status === 410) {
                        debug(`last known resource has expired -- resync required`);
                        res({resourceVersion: lastVersion, resyncRequired: true});
                        return;
                    }

                    rej(new Error("Unexpected status code: " + status));
                    return;
                }
            });

            request.on("end", () => {
                if (clientPingInterval) {
                    clearInterval(clientPingInterval);
                }

                try {
                    const parsedBody = JSON.parse(body);

                    if (isStatus(parsedBody) && parsedBody.status === "Failure") {
                        debug(`watch: failed with status %O`, parsedBody);
                        rej(parsedBody.message);
                        return;
                    }
                } catch (_) {
                    // this is fine; the request body is not guaranteed to be a single JSON document.
                }

                res({resourceVersion: lastVersion});
            });

            request.on("data", async (chunk: Buffer | string) => {
                if (chunk instanceof Buffer) {
                    chunk = chunk.toString("utf-8");
                }

                debug("WATCH request on %o received %d bytes of data", absoluteURL, chunk.length);

                buffer += chunk;
                body += chunk;

                // Line is not yet complete; wait for next chunk.
                if (!buffer.endsWith("\n")) {
                    return;
                }

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

    public async get<R = any>(url: string, listOptions: ListOptions = {}): Promise<R | undefined> {
        const absoluteURL = joinURL(this.config.apiServerURL, url);
        const {labelSelector, fieldSelector} = listOptions;

        let opts: AxiosRequestConfig = {
            url: absoluteURL,
            params: {},
        };

        if (labelSelector) {
            opts.params.labelSelector = selectorToQueryString(labelSelector);
        }

        if (fieldSelector) {
            opts.params.fieldSelector = selectorToQueryString(fieldSelector);
        }

        opts = this.config.mapAxiosOptions(opts);

        debug(`executing GET request on ${opts.url}`);

        const response = await axios(opts);

        if (response.status === 404) {
            debug(`GET request on %o failed with status %o`, opts.url, response.status);

            return undefined;
        }

        if (isStatus(response.data) && response.data.status === "Failure") {
            if (response.data.code === 404) {
                return undefined;
            }

            debug(`executing GET request on %o failed. response body: %O`, response.status, response.data);

            throw(new Error(response.data.message));
        }

        debug(`GET request on %o succeeded with status %o: %O`, opts.url, response.status, response.data);
        return response.data;
    }

}
