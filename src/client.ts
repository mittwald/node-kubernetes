import * as request from "request";
import {IKubernetesClientConfig} from "./config";
import {INamespacedResourceClient, IResourceClient, NamespacedResourceClient, ResourceClient} from "./resource";
import {Pod} from "./types/pod";
import {isStatus} from "./types";
import {PersistentVolume, PersistentVolumeClaim} from "./types/persistentvolume";
import {LabelSelector, labelSelectorToQueryString} from "./label";
import {Service} from "./types/service";
import {Secret} from "./types/secret";
import {ConfigMap} from "./types/configmap";
import {Ingress} from "./types/ingress";
import {Namespace} from "./types/namespace";
import {DeploymentResourceClient} from "./resource/deployment";
import {StatefulSetResourceClient} from "./resource/statefulset";
import {ReplicaSet} from "./types/replicaset";

export type RequestMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";

export interface IKubernetesRESTClientOptions {
    debugFn: (msg: string) => any;
}

const defaultRESTClientOptions: IKubernetesRESTClientOptions = {
    debugFn: () => { return; },
};

export class KubernetesAPI {

    public constructor(private restClient: KubernetesRESTClient) {}

    public pods(): INamespacedResourceClient<Pod, "Pod", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/pods");
    }

    public configMaps(): INamespacedResourceClient<ConfigMap, "ConfigMap", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/configmaps");
    }

    public deployments(): DeploymentResourceClient {
        return new DeploymentResourceClient(this.restClient);
    }

    public ingresses(): INamespacedResourceClient<Ingress, "Ingress", "extensions/v1beta1"> {
        return new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/ingresses");
    }

    public namespaces(): IResourceClient<Namespace, "Namespace", "v1"> {
        return new ResourceClient(this.restClient, "/api/v1", "/namespaces");
    }

    public persistentVolumes(): IResourceClient<PersistentVolume, "PersistentVolume", "v1"> {
        return new ResourceClient(this.restClient, "/api/v1", "/persistentvolumes");
    }

    public persistentVolumeClaims(): INamespacedResourceClient<PersistentVolumeClaim, "PersistentVolumeClaim", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/persistentvolumeclaims");
    }

    public replicaSets(): INamespacedResourceClient<ReplicaSet, "ReplicaSet", "extensions/v1beta1"> {
        return new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/replicasets");
    }

    public services(): INamespacedResourceClient<Service, "Service", "v1"> {
        const client = new NamespacedResourceClient(this.restClient, "/api/v1", "/services");
        client.supportsCollectionDeletion = false;
        return client;
    }

    public statefulSets(): StatefulSetResourceClient {
        return new StatefulSetResourceClient(this.restClient);
    }

    public secrets(): INamespacedResourceClient<Secret, "Secret", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/secrets");
    }
}

export class KubernetesRESTClient {

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
                    rej(body.message);
                    return;
                }

                this.opts.debugFn(`GET request on ${opts.url} succeeded with status ${response.statusCode}: ${body}`);
                res(body);
            });
        });
    }

}
