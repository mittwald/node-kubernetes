import { PodTemplateSpec } from "../../core/v1/pod";
import { LabelSelector, ObjectMeta } from "../../meta/v1";

export interface ReplicaSetSpec {
    minReadySeconds?: number;
    replicas: number;
    selector?: LabelSelector;
    template: PodTemplateSpec;
}

export interface ReplicaSet {
    metadata: ObjectMeta;
    spec: ReplicaSetSpec;
}
