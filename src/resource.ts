import {KubernetesRESTClient, LabelSelector} from "./client";
import {APIObject, MetadataObject} from "./types/meta";

export class ResourceClient<R extends MetadataObject, K, V> {

    protected baseURL: string;

    public constructor(protected client: KubernetesRESTClient,
                       protected apiBaseURL: string,
                       protected resourceBaseURL: string) {
        apiBaseURL = apiBaseURL.replace(/\/$/, "");
        resourceBaseURL = resourceBaseURL.replace(/^\//, "").replace(/\/$/, "");

        this.baseURL = apiBaseURL + "/" + resourceBaseURL;
    }

    protected urlForResource(r: R): string {
        return this.baseURL + "/" + r.metadata.name;
    }

    public async list(labelSelector?: LabelSelector): Promise<(APIObject<K, V> & R)[]> {
        const list = await this.client.get(this.baseURL, labelSelector);
        return list.items;
    }

    public async get(name: string): Promise<(APIObject<K, V> & R) | undefined> {
        return await this.client.get(this.baseURL + "/" + name);
    }

    public async apply(resource: R): Promise<APIObject<K, V> & R> {
        const existing = await this.client.get(this.urlForResource(resource));

        if (existing) {
            return await this.put(resource);
        } else {
            return await this.post(resource);
        }
    }

    public async put(resource: R): Promise<APIObject<K, V> & R> {
        const response = await this.client.put(this.urlForResource(resource), resource);
        console.log(response);
        return response;
    }

    public async post(resource: R): Promise<APIObject<K, V> & R> {
        const response = await this.client.post(this.baseURL, resource);
        console.log(response);
        return response;
    }

}

export class NamespacedResourceClient<R extends MetadataObject, K, V> extends ResourceClient<R, K, V> {
    private ns?: string;

    public constructor(client: KubernetesRESTClient,
                       apiBaseURL: string,
                       resourceBaseURL: string,
                       ns?: string) {
        apiBaseURL = apiBaseURL.replace(/\/$/, "");
        resourceBaseURL = resourceBaseURL.replace(/^\//, "").replace(/\/$/, "");

        super(client, apiBaseURL, resourceBaseURL);

        this.ns = ns;

        if (ns) {
            this.baseURL = apiBaseURL + "/namespaces/" + ns + "/" + resourceBaseURL;
        } else {
            this.baseURL = apiBaseURL + "/" + resourceBaseURL;
        }
    }

    protected urlForResource(r: R): string {
        return this.apiBaseURL + "/namespaces/" + r.metadata.namespace + "/" + this.resourceBaseURL + "/" + r.metadata.name;
    }

    public namespace(ns: string): ResourceClient<R, K, V> {
        return new NamespacedResourceClient<R, K, V>(this.client, this.apiBaseURL, this.resourceBaseURL, ns);
    }

    public allNamespaces(): ResourceClient<R, K, V> {
        return new NamespacedResourceClient<R, K, V>(this.client, this.apiBaseURL, this.resourceBaseURL);
    }

    public async post(resource: R) {
        let url = this.baseURL;
        if (resource.metadata.namespace) {
            url = this.apiBaseURL + "/namespaces/" + resource.metadata.namespace + "/" + this.resourceBaseURL;
        }

        const response = await this.client.post(url, resource);
        console.log(response);
        return response;
    }

}