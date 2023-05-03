import {MetadataObject} from "./types/meta";
import {WatchOptions} from "./client";
import {ListWatchErrorStrategy} from "./resource_listwatch_error";

export interface ListWatchOptions<R extends MetadataObject> extends WatchOptions {
    onResync?: (objs: R[]) => any;
    skipAddEventsOnResync?: boolean;
    errorStrategy?: ListWatchErrorStrategy;
}