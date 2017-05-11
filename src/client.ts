import * as request from "request";
import {IKubernetesClientConfig} from "./config";
import {NamespacedResourceClient, ResourceClient} from "./resource";
import {Pod} from "./types/pod";
import {isStatus} from "./types";
import {PersistentVolume} from "./types/persistentvolume";

export type LabelSelector = {[l: string]: string};

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

    public post<R = any>(url: string, body: any): Promise<R> {
        url = url.replace(/^\//, "");
        const absoluteURL = this.config.apiServerURL + "/" + url;

        return new Promise((res, rej) => {
            let opts: request.Options = {
                method: "POST",
                url: absoluteURL,
                json: body,
            };

            opts = this.config.mapRequestOptions(opts);

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

    public put<R = any>(url: string, body: any): Promise<R> {
        url = url.replace(/^\//, "");
        const absoluteURL = this.config.apiServerURL + "/" + url;

        return new Promise((res, rej) => {
            let opts: request.Options = {
                method: "PUT",
                url: absoluteURL,
                json: body,
            };

            opts = this.config.mapRequestOptions(opts);

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

    public get<R = any>(url: string, labelSelector?: LabelSelector): Promise<R> {
        url = url.replace(/^\//, "");
        const absoluteURL = this.config.apiServerURL + "/" + url;

        return new Promise((res, rej) => {
            let opts: request.Options = {
                url: absoluteURL,
                qs: {},
            };

            if (labelSelector) {
                opts.qs["labelSelector"] = labelSelector;
            }

            opts = this.config.mapRequestOptions(opts);

            request(opts, (err, response, body) => {
                if (err) {
                    rej(err);
                    return;
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