import { MetadataObject } from "../types/meta";
import { INamespacedResourceClient } from "../resource";

interface CacheEntry<TResource extends MetadataObject> {
    entry: TResource;
    until: Date;
}

export interface Store<TResource extends MetadataObject> {
    store(obj: TResource): Promise<void> | void;
    get(namespace: string, name: string): Promise<TResource | undefined> | TResource | undefined;
    pull(obj: TResource): Promise<void> | void;
    sync(objs: TResource[]): Promise<void> | void;
}

export interface ObservableStore<TResource extends MetadataObject> extends Store<TResource> {
    onStoredOrUpdated(fn: (obj: TResource) => any): void;
    onRemoved(fn: (obj: TResource) => any): void;
    onSynced(fn: (objs: TResource[]) => any): void;
}

export class ObservableStoreDecorator<TResource extends MetadataObject> implements ObservableStore<TResource> {
    private readonly onStoreHandlers: Array<(obj: TResource) => any> = [];
    private readonly onRemoveHandlers: Array<(obj: TResource) => any> = [];
    private readonly onSyncedHandlers: Array<(objs: TResource[]) => any> = [];

    public constructor(private readonly inner: Store<TResource>) {}

    public onStoredOrUpdated(fn: (obj: TResource) => any): void {
        this.onStoreHandlers.push(fn);
    }

    public onRemoved(fn: (obj: TResource) => any): void {
        this.onRemoveHandlers.push(fn);
    }

    public onSynced(fn: (objs: TResource[]) => any): void {
        this.onSyncedHandlers.push(fn);
    }

    public get(namespace: string, name: string): Promise<TResource | undefined> | TResource | undefined {
        return this.inner.get(namespace, name);
    }

    public async pull(obj: TResource): Promise<void> {
        await this.inner.pull(obj);
        await Promise.all(this.onRemoveHandlers.map((h) => h(obj)));
    }

    public async store(obj: TResource): Promise<void> {
        await this.inner.store(obj);
        await Promise.all(this.onStoreHandlers.map((h) => h(obj)));
    }

    public async sync(objs: TResource[]): Promise<void> {
        await this.inner.sync(objs);
        await Promise.all(this.onSyncedHandlers.map((h) => h(objs)));
    }
}

export class InMemoryStore<TResource extends MetadataObject> implements Store<TResource> {
    private objects = new Map<string, TResource>();

    public store(obj: TResource) {
        this.objects.set(`${obj.metadata.namespace}/${obj.metadata.name}`, obj);
    }

    public pull(obj: TResource) {
        this.objects.delete(`${obj.metadata.namespace}/${obj.metadata.name}`);
    }

    public async sync(objs: TResource[]) {
        this.objects = new Map<string, TResource>();
        await Promise.all(objs.map((o) => this.store(o)));
    }

    public get(namespace: string, name: string): TResource | undefined {
        return this.objects.get(`${namespace}/${name}`);
    }
}

export class CachingLookupStore<TResource extends MetadataObject> implements Store<TResource> {
    private cache = new Map<string, CacheEntry<TResource>>();

    public constructor(
        private readonly api: INamespacedResourceClient<any, any, any, TResource>,
        private readonly expirationSeconds: number = 3600,
    ) {}

    private storeInMap(obj: TResource, map: Map<string, CacheEntry<TResource>>): void {
        const { namespace, name } = obj.metadata;
        const key = `${namespace}/${name}`;
        const exp = new Date();
        exp.setSeconds(exp.getSeconds() + this.expirationSeconds);

        map.set(key, {
            entry: obj,
            until: exp,
        });
    }

    public store(obj: TResource): void {
        this.storeInMap(obj, this.cache);
    }

    public sync(objs: TResource[]): void {
        const newCache = new Map<string, CacheEntry<TResource>>();

        for (const obj of objs) {
            this.storeInMap(obj, newCache);
        }

        this.cache = newCache;
    }

    public async get(namespace: string, name: string): Promise<TResource | undefined> {
        const key = `${namespace}/${name}`;

        if (this.cache.has(key)) {
            const entry = this.cache.get(key)!;
            if (entry.until > new Date()) {
                return entry.entry;
            }
        }

        const result = await this.api.namespace(namespace).get(name);

        if (result) {
            this.store(result);
        }

        return result;
    }

    public pull(obj: TResource): void {
        const { namespace, name } = obj.metadata;
        const key = `${namespace}/${name}`;

        this.cache.delete(key);
    }
}
