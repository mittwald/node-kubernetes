import * as request from "request";
import {IKubernetesClientConfig} from "./config";
import {isStatus} from "./types";
import {LabelSelector, labelSelectorToQueryString} from "./label";

export type RequestMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";

export interface IKubernetesRESTClientOptions {
    debugFn: (msg: string) => any;
}

const defaultRESTClientOptions: IKubernetesRESTClientOptions = {
    debugFn: () => { return; },
};

export interface IKubernetesRESTClient {
    post<R = any>(url: string, body: any): Promise<R>;
    put<R = any>(url: string, body: any): Promise<R>;
    delete<R = any>(url: string, labelSelector?: LabelSelector, queryParams?: {[k: string]: string}): Promise<R>;
    get<R = any>(url: string, labelSelector?: LabelSelector): Promise<R|undefined>;
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

    public delete<R = any>(url: string, labelSelector?: LabelSelector, queryParams: {[k: string]: string} = {}): Promise<R> {
        const opts: request.CoreOptions = {};

        if (labelSelector) {
            opts.qs = {...queryParams, labelSelector: labelSelectorToQueryString(labelSelector)};
        }

        return this.request<R>(url, undefined, "DELETE", opts);
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
