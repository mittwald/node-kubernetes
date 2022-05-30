import {MetadataObject} from "../types/meta";
import {INamespacedResourceClient} from "../resource";

interface CacheEntry<R extends MetadataObject> {
    entry: R;
    until: Date;
}

export interface Store<R extends MetadataObject> {
    store(obj: R): Promise<void>;
    get(namespace: string, name: string): Promise<R|undefined>;
    pull(obj: R): Promise<void>;
    sync(objs: R[]): Promise<void>;
}

export interface ObservableStore<R extends MetadataObject> extends Store<R> {
    onStoredOrUpdated(fn: (obj: R) => any): void;
    onRemoved(fn: (obj: R) => any): void;
    onSynced(fn: (objs: R[]) => any): void;
}

export class ObservableStoreDecorator<R extends MetadataObject> implements ObservableStore<R> {
    private onStoreHandlers: Array<(obj: R) => any> = [];
    private onRemoveHandlers: Array<(obj: R) => any> = [];
    private onSyncedHandlers: Array<(objs: R[]) => any> = [];

    public constructor(private inner: Store<R>) {
    }

    public onStoredOrUpdated(fn: (obj: R) => any): void {
        this.onStoreHandlers.push(fn);
    }

    public onRemoved(fn: (obj: R) => any): void {
        this.onRemoveHandlers.push(fn);
    }

    public onSynced(fn: (objs: R[]) => any): void {
        this.onSyncedHandlers.push(fn);
    }

    public get(namespace: string, name: string): Promise<R | undefined> {
        return this.inner.get(namespace, name);
    }

    public async pull(obj: R): Promise<void> {
        await this.inner.pull(obj);
        await Promise.all(this.onRemoveHandlers.map(h => h(obj)))
    }

    public async store(obj: R): Promise<void> {
        await this.inner.store(obj);
        await Promise.all(this.onStoreHandlers.map(h => h(obj)))
    }

    public async sync(objs: R[]): Promise<void> {
        await this.inner.sync(objs);
        await Promise.all(this.onSyncedHandlers.map(h => h(objs)))
    }

}

export class InMemoryStore<R extends MetadataObject> implements Store<R> {
    private objects = new Map<string, R>();

    public async store(obj: R) {
        this.objects.set(`${obj.metadata.namespace}/${obj.metadata.name}`, obj);
    }

    public async pull(obj: R) {
        this.objects.delete(`${obj.metadata.namespace}/${obj.metadata.name}`);
    }

    public async sync(objs: R[]) {
        this.objects = new Map<string, R>();
        await Promise.all(objs.map(o => this.store(o)))
    }

    public async get(namespace: string, name: string): Promise<R|undefined> {
        return this.objects.get(`${namespace}/${name}`);
    }
}

export class CachingLookupStore<R extends MetadataObject> implements Store<R> {
    private cache = new Map<string, CacheEntry<R>>();

    public constructor(private api: INamespacedResourceClient<R, any, any>, private expirationSeconds: number = 3600) {
    }

    private storeInMap(obj: R, map: Map<string, CacheEntry<R>>): void {
        const {namespace, name} = obj.metadata;
        const key = `${namespace}/${name}`;
        const exp = new Date();
        exp.setSeconds(exp.getSeconds() + this.expirationSeconds);

        map.set(key, {
            entry: obj,
            until: exp,
        });
    }

    public async store(obj: R): Promise<void> {
        this.storeInMap(obj, this.cache);
    }

    public async sync(objs: R[]) {
        const newCache = new Map<string, CacheEntry<R>>();

        for (const obj of objs) {
            this.storeInMap(obj, newCache);
        }

        this.cache = newCache;
    }

    public async get(namespace: string, name: string): Promise<R | undefined> {
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

    public async pull(obj: R): Promise<void> {
        const {namespace, name} = obj.metadata;
        const key = `${namespace}/${name}`;

        this.cache.delete(key);
    }

}
