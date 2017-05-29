import {LabelSelector, ObjectMeta} from "./meta";
import {PodTemplateSpec} from "./pod";

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
