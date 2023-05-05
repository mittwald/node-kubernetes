import { InMemoryStore, ObservableStore, ObservableStoreDecorator, Store } from "./store";
import { MetadataObject } from "../types/meta";
import { IResourceClient } from "../resource";
import { WatchEvent } from "../types/meta/v1";
import { SelectorOptions } from "../client";
import { ListWatchOptions } from "../resource_listwatch";

const debug = require("debug")("kubernetes:informer");

export interface Controller {
    waitForInitialList(): Promise<void>;

    waitUntilFinish(): Promise<void>;

    stop(): void;
}

export class Informer<TResource extends MetadataObject, TResourceOutput extends TResource = TResource> {
    private readonly resource: IResourceClient<TResource, any, any, TResourceOutput>;
    private readonly opts?: SelectorOptions;

    public readonly store: ObservableStore<TResourceOutput>;

    public constructor(
        resource: IResourceClient<TResource, any, any, TResourceOutput>,
        opts?: SelectorOptions,
        store?: Store<TResourceOutput>,
    ) {
        this.resource = resource;
        this.opts = opts;
        this.store = new ObservableStoreDecorator(store || new InMemoryStore<TResourceOutput>());
    }

    public start(): Controller {
        const handler = async (event: WatchEvent<TResourceOutput>) => {
            const { type, object } = event;

            switch (type) {
                case "ADDED":
                case "MODIFIED":
                    debug(
                        "added or updated object %o: %o",
                        (object as any).kind,
                        `${object.metadata.namespace}/${object.metadata.name}`,
                    );
                    await this.store.store(object);
                    break;
                case "DELETED":
                    debug(
                        "removed object %o: %s",
                        (object as any).kind,
                        `${object.metadata.namespace}/${object.metadata.name}`,
                    );
                    await this.store.pull(object);
                    break;
            }
        };

        const opts: ListWatchOptions<TResourceOutput> = {
            skipAddEventsOnResync: true,
            onResync: async (objs) => {
                debug("resynced %d objects", objs.length);
                await this.store.sync(objs);
            },
            ...this.opts,
        };

        const watchHandle = this.resource.listWatch(handler, undefined, opts);

        return {
            waitForInitialList: () => watchHandle.initialized,
            waitUntilFinish: () => watchHandle.done,
            stop: watchHandle.stop,
        };
    }
}
