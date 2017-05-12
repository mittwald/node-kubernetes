import * as request from "request";
import {IKubernetesClientConfig} from "./config";
import {NamespacedResourceClient, ResourceClient} from "./resource";
import {Pod} from "./types/pod";
import {isStatus} from "./types";
import {PersistentVolume} from "./types/persistentvolume";
import {LabelSelector, labelSelectorToQueryString} from "./label";

export class KubernetesAPI {

    public constructor(private restClient: KubernetesRESTClient) {}

    public pods(): NamespacedResourceClient<Pod, "Pod", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/pods");
    }

    public persistentVolumes(): ResourceClient<PersistentVolume, "PersistentVolume", "v1"> {
        return new ResourceClient(this.restClient, "/api/v1", "/persistentvolumes");
    }
}

export class KubernetesRESTClient {

    public constructor(private config: IKubernetesClientConfig) {}

    private request<R = any>(url: string, body?: any, method: string = "POST", additionalOptions: request.CoreOptions = {}): Promise<R> {
        url = url.replace(/^\//, "");
        const absoluteURL = this.config.apiServerURL + "/" + url;

        return new Promise((res, rej) => {
            let opts: request.Options = {
                method: method,
                url: absoluteURL,
                json: true,
            };

            if (body) {
                opts.json = body;
            }

            opts = this.config.mapRequestOptions(opts);
            opts = {...opts, ...additionalOptions};

            request(opts, (err, response, body) => {
                if (err) {
                    rej(err);
                    return;
                }

                if (isStatus(body) && body.status === "Failure") {
                    rej(new Error(body.message));
                    return;
                }

                res(body);
            });
        });
    }

    public post<R = any>(url: string, body: any): Promise<R> {
        return this.request<R>(url, body, "POST");
    }

    public put<R = any>(url: string, body: any): Promise<R> {
        return this.request<R>(url, body, "PUT");
    }

    public delete<R = any>(url: string, labelSelector?: LabelSelector): Promise<R> {
        const opts: request.CoreOptions = {};

        if (labelSelector) {
            opts.qs = {labelSelector: labelSelectorToQueryString(labelSelector)};
        }

        return this.request<R>(url, undefined, "DELETE", opts);
    }

    public get<R = any>(url: string, labelSelector?: LabelSelector): Promise<R|undefined> {
        url = url.replace(/^\//, "");
        const absoluteURL = this.config.apiServerURL + "/" + url;

        return new Promise<R|undefined>((res, rej) => {
            let opts: request.Options = {
                url: absoluteURL,
                qs: {},
            };

            if (labelSelector) {
                opts.qs["labelSelector"] = labelSelectorToQueryString(labelSelector);
            }

            opts = this.config.mapRequestOptions(opts);

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
                    rej(body.message);
                    return;
                }

                res(body);
            });
        });
    }

}