export interface ObjectMeta {
    name: string;
    namespace?: string;
    labels?: {[key: string]: string};
    annotations?: {[key: string]: string};
}

export interface Resource<K = string, V = "v1"> {
    kind: K;
    apiVersion: V;
}

export type ResourceList<R, K = string, V = "v1"> = Resource<K, V> & {items: null|R[]};

export type MetadataObject = {metadata: ObjectMeta};
export type APIObject<K = string, V = "v1"> = Resource<K, V> & MetadataObject;
export type InputAPIObject<K = string, V = "v1"> = Partial<Resource<K, V>> & MetadataObject;

export type Status = Resource<"Status", "v1"> & {
    status: "Failure";
    message: string;
    reason: "NotFound";
    details: any;
    code: number;
}

export function isStatus(s: {kind: string}): s is Status {
    return "kind" in s && s["kind"] == "Status";
}

export interface APIResourceList {
    kind: "APIResourceList";
    groupVersion: string;
    resources: {
        name: string;
        namespaced: boolean;
        kind: string;
        verbs: string[];
        shortNames?: string[];
    }[]
}