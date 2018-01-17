import {LabelSelector, ObjectMeta} from "../../meta";

export interface NetworkPolicy {
    metadata: ObjectMeta;
    spec: NetworkPolicySpec;
}

export interface NetworkPolicySpec {
    ingress: NetworkPolicyIngressRule[];
    podSelector: LabelSelector;
}

export interface NetworkPolicyIngressRule {
    from?: NetworkPolicyPeer[];
    ports?: NetworkPolicyPort[];
}

export type NetworkPolicyPeer = {namespaceSelector: LabelSelector} | {podSelector: LabelSelector};

export interface NetworkPolicyPort {
    port?: number|string;
    protocol?: "TCP"|"UDP";
}
