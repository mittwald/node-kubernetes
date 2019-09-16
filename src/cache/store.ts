import {MetadataObject} from "../types/meta";
import {INamespacedResourceClient} from "../resource";

interface CacheEntry<R extends MetadataObject> {
    entry: R;
    until: Date;
}

export interface Store<R extends MetadataObject> {
    store(obj: R): void;
    get(namespace: string, name: string): Promise<R|undefined>;
    pull(obj: R): void;
}

export interface ObservableStore<R extends MetadataObject> extends Store<R> {
    onStoredOrUpdated(fn: (obj: R) => any): void;
    onRemoved(fn: (obj: R) => any): void;
}

export class ObservableStoreDecorator<R extends MetadataObject> implements ObservableStore<R> {
    private onStoreHandlers: Array<(obj: R) => any> = [];
    private onRemoveHandlers: Array<(obj: R) => any> = [];

    public constructor(private inner: Store<R>) {
    }

    public onStoredOrUpdated(fn: (obj: R) => any): void {
        this.onStoreHandlers.push(fn);
    }

    public onRemoved(fn: (obj: R) => any): void {
        this.onRemoveHandlers.push(fn);
    }

    public get(namespace: string, name: string): Promise<R | undefined> {
        return this.inner.get(namespace, name);
    }

    public pull(obj: R): void {
        this.inner.pull(obj);
        this.onRemoveHandlers.forEach(fn => fn(obj));
    }

    public store(obj: R): void {
        this.inner.store(obj);
        this.onStoreHandlers.forEach(fn => fn(obj));
    }

}

export class InMemoryStore<R extends MetadataObject> implements Store<R> {
    private objects = new Map<string, R>();

    public store(obj: R) {
        this.objects.set(`${obj.metadata.namespace}/${obj.metadata.name}`, obj);
    }

    public pull(obj: R) {
        this.objects.delete(`${obj.metadata.namespace}/${obj.metadata.name}`);
    }

    public async get(namespace: string, name: string): Promise<R|undefined> {
        return this.objects.get(`${namespace}/${name}`);
    }
}

export class CachingLookupStore<R extends MetadataObject> implements Store<R> {
    private cache = new Map<string, CacheEntry<R>>();

    public constructor(private api: INamespacedResourceClient<R, any, any>, private expirationSeconds: number = 3600) {
    }

    public store(obj: R): void {
        const {namespace, name} = obj.metadata;
        const key = `${namespace}/${name}`;
        const exp = new Date();
        exp.setSeconds(exp.getSeconds() + this.expirationSeconds);

        this.cache.set(key, {
            entry: obj,
            until: exp,
        });
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

    public pull(obj: R): void {
        const {namespace, name} = obj.metadata;
        const key = `${namespace}/${name}`;

        this.cache.delete(key);
    }

}
