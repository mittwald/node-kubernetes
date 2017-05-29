import {KubernetesRESTClient} from "./client";
import {APIObject, MetadataObject} from "./types/meta";
import {LabelSelector} from "./label";

export interface IResourceClient<R extends MetadataObject, K, V> {
    list(labelSelector?: LabelSelector): Promise<Array<APIObject<K, V> & R>>;
    get(name: string): Promise<(APIObject<K, V> & R) | undefined>;
    apply(resource: R): Promise<APIObject<K, V> & R>;
    put(resource: R): Promise<APIObject<K, V> & R>;
    post(resource: R): Promise<APIObject<K, V> & R>;
    delete(resourceOrName: R|string): Promise<void>;
    deleteMany(labelSelector: LabelSelector): Promise<void>;
}

export interface INamespacedResourceClient<R extends MetadataObject, K, V> extends IResourceClient<R, K, V> {
    namespace(ns: string): IResourceClient<R, K, V>;
    allNamespaces(): IResourceClient<R, K, V>;
}

export class ResourceClient<R extends MetadataObject, K, V> implements IResourceClient<R, K, V> {

    protected baseURL: string;
    public supportsCollectionDeletion: boolean = true;

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

    public async list(labelSelector?: LabelSelector): Promise<Array<APIObject<K, V> & R>> {
        const list = await this.client.get(this.baseURL, labelSelector);
        return list.items || [];
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
        return await this.client.put(this.urlForResource(resource), resource);
    }

    public async post(resource: R): Promise<APIObject<K, V> & R> {
        return await this.client.post(this.baseURL, resource);
    }

    public async delete(resourceOrName: R|string): Promise<void> {
        let url;
        if (typeof resourceOrName === "string") {
            url = this.baseURL + "/" + resourceOrName;
        } else {
            url = this.urlForResource(resourceOrName);
        }

        return await this.client.delete(url);
    }

    public async deleteMany(labelSelector: LabelSelector) {
        if (this.supportsCollectionDeletion) {
            return await this.client.delete(this.baseURL, labelSelector);
        }

        const resources = await this.list(labelSelector);
        await Promise.all(resources.map(r => this.delete(r)));
    }

}

export class NamespacedResourceClient<R extends MetadataObject, K, V> extends ResourceClient<R, K, V> implements INamespacedResourceClient<R, K, V> {
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

    public namespace(ns: string): IResourceClient<R, K, V> {
        const n = new NamespacedResourceClient<R, K, V>(this.client, this.apiBaseURL, this.resourceBaseURL, ns);
        n.supportsCollectionDeletion = this.supportsCollectionDeletion;
        return n;
    }

    public allNamespaces(): IResourceClient<R, K, V> {
        const n = new NamespacedResourceClient<R, K, V>(this.client, this.apiBaseURL, this.resourceBaseURL);
        n.supportsCollectionDeletion = this.supportsCollectionDeletion;
        return n;
    }

    public async post(resource: R) {
        let url = this.baseURL;
        if (resource.metadata.namespace) {
            url = this.apiBaseURL + "/namespaces/" + resource.metadata.namespace + "/" + this.resourceBaseURL;
        }

        const response = await this.client.post(url, resource);
        return response;
    }

}
