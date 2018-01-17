import {ObjectReference} from "../../meta";
import {ObjectMeta} from "../../meta/v1";

export interface NodeSpec {
    configSource: NodeConfigSource;
    externalID: string;
    podCIDR: string;
    providerID: string;
    taints: Taint[];
    unschedulable: boolean;
}

export interface NodeConfigSource {
    apiVersion: string;
    configMapRef: ObjectReference;
    kind: string;
}

export interface Taint {
    effect: string;
    key: string;
    timeAdded?: string;
    value: string;
}

export interface Node<M = ObjectMeta> {
    metadata: M;
    spec: NodeSpec;
}
