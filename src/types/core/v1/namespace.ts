import { ObjectMeta } from "../../meta/v1";

export interface NamespaceSpec {
    finalizers?: string[];
}

export interface Namespace {
    metadata: ObjectMeta;
    spec?: NamespaceSpec;
}
