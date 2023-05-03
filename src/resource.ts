import {
    IKubernetesRESTClient,
    ListOptions,
    MandatorySelectorOptions,
    patchKindJSONPatch,
    patchKindMergePatch,
    patchKindStrategicMergePatch,
    WatchOptions,
    WatchResult,
} from "./client";
import {APIObject, MetadataObject, ResourceList} from "./types/meta";
import {DeleteOptions, WatchEvent} from "./types/meta/v1";
import {WatchHandle} from "./watch";
import {Counter, Gauge, Registry} from "prom-client";
import {JSONPatch, JSONPatchElement, RecursivePartial} from "./api_patch";
import {DefaultListWatchErrorStrategy, ListWatchErrorStrategy} from "./resource_listwatch_error";

const debug = require("debug")("kubernetes:resource");

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface ListWatchOptions<R extends MetadataObject> extends WatchOptions {
    onResync?: (objs: R[]) => any;
    skipAddEventsOnResync?: boolean;
    errorStrategy?: ListWatchErrorStrategy;
}

export interface IResourceClient<R extends MetadataObject, K, V, O extends R = R> {
    list(listOptions?: ListOptions): Promise<Array<APIObject<K, V> & O>>;

    get(name: string): Promise<(APIObject<K, V> & O) | undefined>;

    apply(resource: R): Promise<APIObject<K, V> & O>;

    put(resource: R): Promise<APIObject<K, V> & O>;

    post(resource: R): Promise<APIObject<K, V> & O>;

    patchStrategic(resourceOrName: R|string, patch: RecursivePartial<R>): Promise<APIObject<K, V> & O>;

    patchMerge(resourceOrName: R|string, patch: RecursivePartial<R>): Promise<APIObject<K, V> & O>;

    patchJSON(resourceOrName: R|string, patch: JSONPatch): Promise<R>;

    delete(resourceOrName: R | string, deleteOptions?: DeleteOptions): Promise<void>;

    deleteMany(opts: MandatorySelectorOptions & DeleteOptions): Promise<void>;

    watch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts?: WatchOptions): Promise<WatchResult>;

    listWatch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts?: ListWatchOptions<O>): WatchHandle;
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

    public list(listOptions?: ListOptions): Promise<Array<APIObject<K, V> & O>> {
        return this.inner.list(listOptions);
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

    public deleteMany(opts: MandatorySelectorOptions & DeleteOptions): Promise<void> {
        return this.inner.deleteMany(opts);
    }

    public watch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts?: WatchOptions): Promise<WatchResult> {
        return this.inner.watch(handler, errorHandler, opts);
    }

    public listWatch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts?: ListWatchOptions<O>): WatchHandle {
        return this.inner.listWatch(handler, errorHandler, opts);
    }

    public patchJSON(resourceOrName: string | R, patch: JSONPatchElement[]): Promise<R> {
        return this.inner.patchJSON(resourceOrName, patch);
    }

    public patchStrategic(resourceOrName: string | R, patch: RecursivePartial<R>): Promise<APIObject<K, V> & O> {
        return this.inner.patchStrategic(resourceOrName, patch);
    }

    public patchMerge(resourceOrName: string | R, patch: RecursivePartial<R>): Promise<APIObject<K, V> & O> {
        return this.inner.patchMerge(resourceOrName, patch);
    }

    public namespace(ns: string): INamespacedResourceClient<R, K, V, O> {
        return new CustomResourceClient<R, K, V, O>(this.inner.namespace(ns), this.kind, this.apiVersion);
    }

    public allNamespaces(): INamespacedResourceClient<R, K, V, O> {
        return new CustomResourceClient<R, K, V, O>(this.inner.allNamespaces(), this.kind, this.apiVersion);
    }
}

const resourceMetricLabels = ["baseURL"];
type ResourceMetricLabels = typeof resourceMetricLabels[0];

export class ResourceClient<R extends MetadataObject, K, V, O extends R = R> implements IResourceClient<R, K, V, O> {
    private static watchResyncErrorCount: Counter<ResourceMetricLabels>;
    private static watchOpenCount: Gauge<ResourceMetricLabels>;

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
                labelNames: resourceMetricLabels,
            });
        }

        if (!ResourceClient.watchOpenCount) {
            ResourceClient.watchOpenCount = new Gauge({
                name: "kubernetes_listwatch_open",
                help: "Amount of currently open listwatches",
                registers: [registry],
                labelNames: resourceMetricLabels,
            });
        }
    }

    protected urlForResource(r: R): string {
        return this.baseURL + "/" + r.metadata.name;
    }

    protected urlForResourceOrName(r: R|string): string {
        return (typeof r === "string") ? this.baseURL + "/" + r : this.urlForResource(r);
    }

    public async list(opts?: ListOptions): Promise<Array<APIObject<K, V> & O>> {
        const list = await this.client.get(this.baseURL, opts);
        return list.items || [];
    }

    public async get(name: string): Promise<(APIObject<K, V> & O) | undefined> {
        return await this.client.get(this.baseURL + "/" + name);
    }

    public watch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts: WatchOptions = {}): Promise<WatchResult> {
        errorHandler = errorHandler || (() => {});
        return this.client.watch(this.baseURL, handler, errorHandler, opts);
    }

    public listWatch(handler: (event: WatchEvent<O>) => any, errorHandler?: (error: any) => any, opts: ListWatchOptions<O> = {}): WatchHandle {
        let resourceVersion = 0;
        let running = true;

        ResourceClient.watchOpenCount.inc({baseURL: this.baseURL});
        debug("starting list-watch on %o", this.resourceBaseURL);

        const {
            resyncAfterIterations = 10,
            errorStrategy = DefaultListWatchErrorStrategy,
        } = opts;

        const resync = () => this.client.get(this.baseURL, opts)
            .then(async (list: ResourceList<O>) => {
                resourceVersion = parseInt(list.metadata.resourceVersion, 10);

                if (opts.onResync) {
                    await opts.onResync(list.items || []);
                }

                if (!opts.skipAddEventsOnResync) {
                    for (const i of list.items || []) {
                        const event: WatchEvent<O> = {type: "ADDED", object: i};
                        await handler(event);
                    }
                }
            });

        // Wrap the handler to keep track of the resourceVersion
        const watchHandler = async (event: WatchEvent<O>) => {
            if (event.object.metadata.resourceVersion) {
                resourceVersion = Math.max(resourceVersion, parseInt(event.object.metadata.resourceVersion, 10));
            }
            await handler(event);
        }

        const initialized = resync();

        const done = initialized.then(async () => {
            errorHandler = errorHandler || (() => {});
            let errorCount = 0;
            let successCount = 1;

            const onEstablished = () => {
                errorCount = 0;
                successCount ++;
            };

            debug("initial list for list-watch on %o completed", this.resourceBaseURL);

            while (running) {
                try {
                    if (successCount % resyncAfterIterations === 0) {
                        debug(`resyncing after ${resyncAfterIterations} successful WATCH iterations`);
                        await resync();
                    }

                    debug("resuming watch after %o successful iterations and %o errors", successCount, errorCount);
                    const watchOpts: WatchOptions = {...opts, resourceVersion, onEstablished};

                    const result = await this.client.watch(this.baseURL, watchHandler, errorHandler, watchOpts);
                    if (result.resyncRequired) {
                        debug(`resyncing listwatch`);
                        await resync();

                        continue;
                    }

                    resourceVersion = Math.max(resourceVersion, result.resourceVersion);
                } catch (err) {
                    errorCount++;

                    const reaction = errorStrategy(err, errorCount);

                    ResourceClient.watchResyncErrorCount.inc({baseURL: this.baseURL});

                    debug("encountered error while watching: %o; determined reaction: %o", err, reaction);

                    if (opts.onError) {
                        await opts.onError(err);
                    }

                    if (opts.abortAfterErrorCount && errorCount > opts.abortAfterErrorCount) {
                        ResourceClient.watchOpenCount.dec({baseURL: this.baseURL});
                        throw new Error(`more than ${opts.abortAfterErrorCount} consecutive errors when watching ${this.baseURL}`);
                    }

                    if (reaction.backoff) {
                        debug("resuming watch after back-off of %o ms", reaction.backoff);
                        await sleep(reaction.backoff);
                    }

                    if (reaction.resync) {
                        debug("resuming watch with resync after error: %o", err);
                        await resync();
                    }
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
        return await this.client.patch(this.urlForResourceOrName(resourceOrName), patch, patchKindStrategicMergePatch);
    }

    public async patchMerge(resourceOrName: R|string, patch: RecursivePartial<R>): Promise<APIObject<K, V> & O> {
        return await this.client.patch(this.urlForResourceOrName(resourceOrName), patch, patchKindMergePatch);
    }

    public async patchJSON(resourceOrName: R|string, patch: JSONPatch): Promise<APIObject<K, V> & O> {
        return await this.client.patch(this.urlForResourceOrName(resourceOrName), patch, patchKindJSONPatch);
    }

    public async delete(resourceOrName: R | string, deleteOptions?: DeleteOptions): Promise<void> {
        let url;
        if (typeof resourceOrName === "string") {
            url = this.baseURL + "/" + resourceOrName;
        } else {
            url = this.urlForResource(resourceOrName);
        }

        return await this.client.delete(url, deleteOptions);
    }

    public async deleteMany(opts: MandatorySelectorOptions & DeleteOptions) {
        if (this.supportsCollectionDeletion) {
            return await this.client.delete(this.baseURL, opts);
        }

        const resources = await this.list(opts);
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
