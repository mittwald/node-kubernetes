export interface WatchEvent<O> {
    type: "ADDED" | "MODIFIED" | "DELETED" | "ERROR";
    object: O;
}
