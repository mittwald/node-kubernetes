import * as request from "request";
import {IKubernetesClientConfig} from "./config";
import {LabelSelector, labelSelectorToQueryString} from "./label";
import {isStatus, MetadataObject} from "./types/meta";
import {WatchEvent} from "./types/meta/v1";

const debug = require("debug")("k8s:client");

export type RequestMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";

export interface IKubernetesRESTClientOptions {
    debugFn: (msg: string) => any;
}

const defaultRESTClientOptions: IKubernetesRESTClientOptions = {
    debugFn: () => { return; },
};

export interface WatchOptions {
    labelSelector?: LabelSelector;
    resourceVersion?: number;
}

export interface WatchResult {
    resourceVersion: number;
}

export interface IKubernetesRESTClient {
    post<R = any>(url: string, body: any): Promise<R>;
    put<R = any>(url: string, body: any): Promise<R>;
    delete<R = any>(url: string, labelSelector?: LabelSelector, queryParams?: {[k: string]: string}, body?: any): Promise<R>;
    get<R = any>(url: string, labelSelector?: LabelSelector): Promise<R|undefined>;
    watch<R extends MetadataObject = MetadataObject>(url: string, onUpdate: (o: WatchEvent<R>) => any, onError: (err: any) => any, opts?: WatchOptions): Promise<WatchResult>;
}

export class KubernetesRESTClient implements IKubernetesRESTClient {

    private opts: IKubernetesRESTClientOptions;

    public constructor(private config: IKubernetesClientConfig, opts: Partial<IKubernetesRESTClientOptions> = {}) {
        this.opts = {...defaultRESTClientOptions, ...opts};
    }

    private request<R = any>(url: string, body?: any, method: RequestMethod = "POST", additionalOptions: request.CoreOptions = {}): Promise<R> {
        url = url.replace(/^\//, "");
        const absoluteURL = this.config.apiServerURL + "/" + url;

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
            opts = {...opts, ...additionalOptions};

            this.opts.debugFn(`executing ${method} request on ${opts.url}`);

            request(opts, (err, response, responseBody) => {
                if (err) {
                    rej(err);
                    return;
                }

                if (isStatus(responseBody) && responseBody.status === "Failure") {
                    rej(new Error(responseBody.message));
                    return;
                }

                this.opts.debugFn(`${method} request on ${opts.url} succeeded with status ${response.statusCode}: ${responseBody}`);
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

    public delete<R = any>(url: string, labelSelector?: LabelSelector, queryParams: {[k: string]: string} = {}, body?: any): Promise<R> {
        const opts: request.CoreOptions = {};

        if (labelSelector) {
            opts.qs = {...queryParams, labelSelector: labelSelectorToQueryString(labelSelector)};
        }

        return this.request<R>(url, body, "DELETE", opts);
    }

    public watch<R extends MetadataObject = MetadataObject>(url: string,
                                                            onUpdate: (o: WatchEvent<R>) => any,
                                                            onError: (err: any) => any,
                                                            watchOpts: WatchOptions = {}): Promise<WatchResult> {
        url = url.replace(/^\//, "");
        const absoluteURL = this.config.apiServerURL + "/" + url;
        let opts: request.Options = {
            url: absoluteURL,
            qs: {watch: "true"},
        };

        if (watchOpts.labelSelector) {
            opts.qs.labelSelector = labelSelectorToQueryString(watchOpts.labelSelector);
        }

        if (watchOpts.resourceVersion) {
            opts.qs.resourceVersion = watchOpts.resourceVersion;
        }

        opts = this.config.mapRequestOptions(opts);

        let lastVersion: number = watchOpts.resourceVersion || 0;

        this.opts.debugFn(`executing WATCH request on ${absoluteURL} (starting revision ${lastVersion})`);

        return new Promise<WatchResult>((res, rej) => {
            const req = request(opts, (err, response, bodyString) => {
                if (err) {
                    rej(err);
                    return;
                }

                if (response.statusCode && response.statusCode >= 400) {
                    rej(new Error("Unexpected status code: " + response.statusCode));
                    return;
                }

                if (bodyString.length === 0) {
                    this.opts.debugFn(`WATCH request on ${url} returned empty response`);
                    res({resourceVersion: lastVersion});
                }

                let body: any;

                try {
                    body = JSON.parse(bodyString);
                } catch (err) {
                    if (bodyString.length > 0) {
                        const bodyLines = bodyString.split("\n");
                        for (const line of bodyLines) {
                            const parsedLine: WatchEvent<R> = JSON.parse(line);
                            if (parsedLine.type === "ADDED" || parsedLine.type === "MODIFIED" || parsedLine.type === "DELETED") {
                                const resourceVersion = parseInt(parsedLine.object.metadata.resourceVersion || "0", 10);
                                if (resourceVersion > lastVersion) {
                                    this.opts.debugFn(`watch: emitting missed ${parsedLine.type} event for ${parsedLine.object.metadata.name}`);

                                    lastVersion = resourceVersion;
                                    onUpdate(parsedLine);
                                }
                            }
                        }

                        res({resourceVersion: lastVersion});
                        return;
                    }

                    rej(err);
                    return;
                }

                if (isStatus(body) && body.status === "Failure") {
                    rej(body.message);
                    return;
                }

                res({resourceVersion: lastVersion});
            });

            let buffer = "";

            req.on("data", chunk => {
                if (chunk instanceof Buffer) {
                    chunk = chunk.toString("utf-8");
                }

                buffer += chunk;

                try {
                    const obj: WatchEvent<R> = JSON.parse(buffer);
                    buffer = "";

                    const resourceVersion = obj.object.metadata.resourceVersion ? parseInt(obj.object.metadata.resourceVersion, 10) : -1;
                    if (resourceVersion > lastVersion) {
                        this.opts.debugFn(`watch: emitting ${obj.type} event for ${obj.object.metadata.name}`);

                        lastVersion = resourceVersion;
                        onUpdate(obj);
                    }
                } catch (err) {
                    onError(err);
                }
            });
        });
    }

    public get<R = any>(url: string, labelSelector?: LabelSelector): Promise<R|undefined> {
        url = url.replace(/^\//, "");
        const absoluteURL = this.config.apiServerURL + "/" + url;

        return new Promise<R|undefined>((res, rej) => {
            let opts: request.OptionsWithUrl = {
                url: absoluteURL,
                qs: {},
            };

            if (labelSelector) {
                opts.qs.labelSelector = labelSelectorToQueryString(labelSelector);
            }

            opts = this.config.mapRequestOptions(opts);

            this.opts.debugFn(`executing GET request on ${opts.url}`);

            request(opts, (err, response, body) => {
                if (err) {
                    rej(err);
                    return;
                }

                if (response.statusCode === 404) {
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
                    rej(new Error(body.message));
                    return;
                }

                this.opts.debugFn(`GET request on ${opts.url} succeeded with status ${response.statusCode}: ${body}`);
                res(body);
            });
        });
    }

}
