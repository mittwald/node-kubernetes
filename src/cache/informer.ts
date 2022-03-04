import {InMemoryStore, ObservableStore, ObservableStoreDecorator, Store} from "./store";
import {MetadataObject} from "../types/meta";
import {IResourceClient, ListWatchOptions} from "../resource";
import {WatchEvent} from "../types/meta/v1";
import {SelectorOptions} from "../client";

const debug = require("debug")("kubernetes:informer");

export interface Controller {
    waitForInitialList(): Promise<void>;

    waitUntilFinish(): Promise<void>;

    stop(): void;
}

export class Informer<R extends MetadataObject, O extends R = R> {
    public readonly store: ObservableStore<O>;

    public constructor(
        private resource: IResourceClient<R, any, any, O>,
        private opts?: SelectorOptions,
        store?: Store<O>,
    ) {
        this.store = new ObservableStoreDecorator(store || new InMemoryStore());
    }

    public start(): Controller {
        const handler = async (event: WatchEvent<O>) => {
            const {type, object} = event;

            switch (type) {
                case "ADDED":
                case "MODIFIED":
                    debug("added or updated object %o: %o", (object as any).kind, `${object.metadata.namespace}/${object.metadata.name}`);
                    await this.store.store(object);
                    break;
                case "DELETED":
                    debug("removed object %o: %s", (object as any).kind, `${object.metadata.namespace}/${object.metadata.name}`);
                    await this.store.pull(object);
                    break;
            }
        };

        const opts: ListWatchOptions<O> = {
            skipAddEventsOnResync: true,
            onResync: async (objs) => {
                debug("resynced %d objects", objs.length);
                await this.store.sync(objs);
            },
            ...this.opts,
        }

        const watchHandle = this.resource.listWatch(handler, undefined, opts);

        return {
            waitForInitialList: () => watchHandle.initialized,
            waitUntilFinish: () => watchHandle.done,
            stop: watchHandle.stop,
        };
    }

}
