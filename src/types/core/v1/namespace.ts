import {ObjectMeta} from "../../meta";

export interface NamespaceSpec {
    finalizers?: string[];
}

export interface Namespace {
    metadata: ObjectMeta;
    spec?: NamespaceSpec;
}
