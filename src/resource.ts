import {IKubernetesRESTClient, PatchKindStrategicMergePatch, WatchOptions, WatchResult} from "./client";
import {APIObject, MetadataObject, ResourceList} from "./types/meta";
import {DeleteOptions, WatchEvent} from "./types/meta/v1";
import {LabelSelector} from "./label";
import {WatchHandle} from "./watch";
import {Counter, Gauge, Registry} from "prom-client";
import {JSONPatch, JSONPatchElement, RecursivePartial} from "./api_patch";

const debug = require("debug")("kubernetes:resource");

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface IResourceClient<R extends MetadataObject, K, V, O extends R = R> {
    list(labelSelector?: LabelSelector): Promise<Array<APIObject<K, V> & O>>;

    get(name: string): Promise<(APIObject<K, V> & O) | undefined>;

    apply(resource: R): Promise<APIObject<K, V> & O>;

    put(resource: R): Promise<APIObject<K, V> & O>;

    post(resource: R): Promise<APIObject<K, V> & O>;

    patchStrategic(resourceOrName: R|string, patch: RecursivePartial<R>): Promise<APIObject<K, V> & O>;

    patchJSON(resourceOrName: R|string, patch: JSONPatch): Promise<R>;

    delete(resourceOrName: R | string, deleteOptions?: DeleteOptions): Promise<void>;

    deleteMany(labelSelector: LabelSelector): Promise<void>;

    watch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts?: WatchOptions): Promise<WatchResult>;

    listWatch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts?: WatchOptions): WatchHandle;
}

export interface INamespacedResourceClient<R extends MetadataObject, K, V, O extends R = R> extends IResourceClient<R, K, V, O> {
    namespace(ns: string): INamespacedResourceClient<R, K, V, O>;

    allNamespaces(): INamespacedResourceClient<R, K, V, O>;
}

export class CustomResourceClient<R extends MetadataObject, K, V, O extends R = R> implements INamespacedResourceClient<R, K, V, O> {
    public constructor(private inner: INamespacedResourceClient<R, K, V, O>,
                       private kind: K,
                       private apiVersion: V) {
    }

    public list(labelSelector?: LabelSelector): Promise<Array<APIObject<K, V> & O>> {
        return this.inner.list(labelSelector);
    }

    public get(name: string): Promise<(APIObject<K, V> & O) | undefined> {
        return this.inner.get(name);
    }

    public apply(resource: R): Promise<APIObject<K, V> & O> {
        return this.inner.apply({...(resource as any), kind: this.kind, apiVersion: this.apiVersion});
    }

    public put(resource: R): Promise<APIObject<K, V> & O> {
        return this.inner.put({...(resource as any), kind: this.kind, apiVersion: this.apiVersion});
    }

    public post(resource: R): Promise<APIObject<K, V> & O> {
        return this.inner.post({...(resource as any), kind: this.kind, apiVersion: this.apiVersion});
    }

    public delete(resourceOrName: string | R, deleteOptions?: DeleteOptions): Promise<void> {
        return this.inner.delete(resourceOrName, deleteOptions);
    }

    public deleteMany(labelSelector: LabelSelector): Promise<void> {
        return this.inner.deleteMany(labelSelector);
    }

    public watch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts?: WatchOptions): Promise<WatchResult> {
        return this.inner.watch(handler, errorHandler, opts);
    }

    public listWatch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts?: WatchOptions): WatchHandle {
        return this.inner.listWatch(handler, errorHandler, opts);
    }

    public patchJSON(resourceOrName: string | R, patch: JSONPatchElement[]): Promise<R> {
        return this.inner.patchJSON(resourceOrName, patch);
    }

    public patchStrategic(resourceOrName: string | R, patch: RecursivePartial<R>): Promise<APIObject<K, V> & O> {
        return this.inner.patchStrategic(resourceOrName, patch);
    }

    public namespace(ns: string): INamespacedResourceClient<R, K, V, O> {
        return new CustomResourceClient<R, K, V, O>(this.inner.namespace(ns), this.kind, this.apiVersion);
    }

    public allNamespaces(): INamespacedResourceClient<R, K, V, O> {
        return new CustomResourceClient<R, K, V, O>(this.inner.allNamespaces(), this.kind, this.apiVersion);
    }
}

export class ResourceClient<R extends MetadataObject, K, V, O extends R = R> implements IResourceClient<R, K, V, O> {
    private static watchResyncErrorCount: Counter;
    private static watchOpenCount: Gauge;

    protected baseURL: string;

    public supportsCollectionDeletion: boolean = true;

    public constructor(protected client: IKubernetesRESTClient,
                       protected apiBaseURL: string,
                       protected resourceBaseURL: string,
                       registry: Registry) {
        this.apiBaseURL = apiBaseURL.replace(/\/$/, "");
        this.resourceBaseURL = resourceBaseURL.replace(/^\//, "").replace(/\/$/, "");

        this.baseURL = apiBaseURL + "/" + resourceBaseURL;

        // Metrics need to be static, because there can be multiple ResourceClients, but
        // metrics may exist only _once_.
        if (!ResourceClient.watchResyncErrorCount) {
            ResourceClient.watchResyncErrorCount = new Counter({
                name: "kubernetes_listwatch_resync_errors",
                help: "Amount of resync errors while running listwatches",
                registers: [registry],
                labelNames: ["baseURL"],
            });
        }

        if (!ResourceClient.watchOpenCount) {
            ResourceClient.watchOpenCount = new Gauge({
                name: "kubernetes_listwatch_open",
                help: "Amount of currently open listwatches",
                registers: [registry],
                labelNames: ["baseURL"],
            });
        }
    }

    protected urlForResource(r: R): string {
        return this.baseURL + "/" + r.metadata.name;
    }

    protected urlForResourceOrName(r: R|string): string {
        return (typeof r === "string") ? this.baseURL + "/" + r : this.urlForResource(r);
    }

    public async list(labelSelector?: LabelSelector): Promise<Array<APIObject<K, V> & O>> {
        const list = await this.client.get(this.baseURL, labelSelector);
        return list.items || [];
    }

    public async get(name: string): Promise<(APIObject<K, V> & O) | undefined> {
        return await this.client.get(this.baseURL + "/" + name);
    }

    public watch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts: WatchOptions = {}): Promise<WatchResult> {
        errorHandler = errorHandler || (() => {});
        return this.client.watch(this.baseURL, handler, errorHandler, opts);
    }

    public listWatch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts: WatchOptions = {}): WatchHandle {
        let resourceVersion = 0;
        let running = true;

        ResourceClient.watchOpenCount.inc({baseURL: this.baseURL});
        debug("starting list-watch on %o", this.resourceBaseURL);

        const resync = () => this.client.get(this.baseURL, opts.labelSelector)
            .then((list: ResourceList<O>) => {
                resourceVersion = parseInt(list.metadata.resourceVersion, 10);

                for (const i of list.items || []) {
                    const event: WatchEvent<O> = {type: "ADDED", object: i};
                    handler(event);
                }
            });

        const initialized = resync();

        const done = initialized.then(async () => {
            errorHandler = errorHandler || (() => {});
            let errorCount = 0;

            debug("initial list for list-watch on %o completed", this.resourceBaseURL);

            while (running) {
                try {
                    const result = await this.client.watch(this.baseURL, handler, errorHandler, {...opts, resourceVersion});
                    resourceVersion = Math.max(resourceVersion, result.resourceVersion);
                    errorCount = 0;
                } catch (err) {
                    errorCount++;

                    ResourceClient.watchResyncErrorCount.inc({baseURL: this.baseURL});

                    if (opts.onError) {
                        opts.onError(err);
                    }

                    if (opts.abortAfterErrorCount && errorCount > opts.abortAfterErrorCount) {
                        ResourceClient.watchOpenCount.dec({baseURL: this.baseURL});
                        throw new Error(`more than ${opts.abortAfterErrorCount} consecutive errors when watching ${this.baseURL}`);
                    }

                    debug("resuming watch after back-off of %o ms", 10000);
                    await sleep(10000);

                    debug("resuming watch with resync after error: %o", err);
                    await resync();
                }
            }

            ResourceClient.watchOpenCount.dec({baseURL: this.baseURL});
        });

        return {
            initialized,
            done,
            stop() {
                running = false;
            },
        };
    }

    public async apply(resource: R): Promise<APIObject<K, V> & O> {
        const existing = await this.client.get(this.urlForResource(resource));

        if (existing) {
            return await this.put(resource);
        } else {
            return await this.post(resource);
        }
    }

    public async put(resource: R): Promise<APIObject<K, V> & O> {
        return await this.client.put(this.urlForResource(resource), resource);
    }

    public async post(resource: R): Promise<APIObject<K, V> & O> {
        return await this.client.post(this.baseURL, resource);
    }

    public async patchStrategic(resourceOrName: R|string, patch: RecursivePartial<R>): Promise<APIObject<K, V> & O> {
        return await this.client.patch(this.urlForResourceOrName(resourceOrName), patch, PatchKindStrategicMergePatch);
    }

    public async patchJSON(resourceOrName: R|string, patch: JSONPatch): Promise<APIObject<K, V> & O> {
        return await this.client.patch(this.urlForResourceOrName(resourceOrName), patch, PatchKindStrategicMergePatch);
    }

    public async delete(resourceOrName: R | string, deleteOptions?: DeleteOptions): Promise<void> {
        let url;
        if (typeof resourceOrName === "string") {
            url = this.baseURL + "/" + resourceOrName;
        } else {
            url = this.urlForResource(resourceOrName);
        }

        return await this.client.delete(url, undefined, undefined, deleteOptions);
    }

    public async deleteMany(labelSelector: LabelSelector) {
        if (this.supportsCollectionDeletion) {
            return await this.client.delete(this.baseURL, labelSelector);
        }

        const resources = await this.list(labelSelector);
        await Promise.all(resources.map(r => this.delete(r)));
    }

}

export class NamespacedResourceClient<R extends MetadataObject, K, V, O extends R = R> extends ResourceClient<R, K, V, O> implements INamespacedResourceClient<R, K, V, O> {
    private ns?: string;

    public constructor(client: IKubernetesRESTClient,
                       apiBaseURL: string,
                       resourceBaseURL: string,
                       private registry: Registry,
                       ns?: string) {
        super(client, apiBaseURL, resourceBaseURL, registry);

        apiBaseURL = apiBaseURL.replace(/\/$/, "");
        resourceBaseURL = resourceBaseURL.replace(/^\//, "").replace(/\/$/, "");

        this.ns = ns;

        if (ns) {
            this.baseURL = apiBaseURL + "/namespaces/" + ns + "/" + resourceBaseURL;
        } else {
            this.baseURL = apiBaseURL + "/" + resourceBaseURL;
        }
    }

    protected urlForResource(r: R): string {
        const namespace = r.metadata.namespace || this.ns;
        if (namespace) {
            return this.apiBaseURL + "/namespaces/" + namespace + "/" + this.resourceBaseURL + "/" + r.metadata.name;
        }

        return this.apiBaseURL + "/" + this.resourceBaseURL + "/" + r.metadata.name;
    }

    public namespace(ns: string): INamespacedResourceClient<R, K, V, O> {
        const n = new NamespacedResourceClient<R, K, V, O>(this.client, this.apiBaseURL, this.resourceBaseURL, this.registry, ns);
        n.supportsCollectionDeletion = this.supportsCollectionDeletion;
        return n;
    }

    public allNamespaces(): INamespacedResourceClient<R, K, V, O> {
        const n = new NamespacedResourceClient<R, K, V, O>(this.client, this.apiBaseURL, this.resourceBaseURL, this.registry);
        n.supportsCollectionDeletion = this.supportsCollectionDeletion;
        return n;
    }

    public async post(resource: R) {
        let url = this.baseURL;
        if (resource.metadata.namespace) {
            url = this.apiBaseURL + "/namespaces/" + resource.metadata.namespace + "/" + this.resourceBaseURL;
        }

        return await this.client.post(url, resource);
    }

}
