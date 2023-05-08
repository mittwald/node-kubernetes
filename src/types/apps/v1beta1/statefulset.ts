import { PersistentVolumeClaim, PodTemplateSpec } from "../../core/v1";
import { LabelSelector, ObjectMeta } from "../../meta/v1";

export type StatefulSetUpdateStrategy =
    | { type: "OnDelete" }
    | { type: "RollingUpdate"; rollingUpdate?: { partition: number } };

export interface StatefulSetSpec {
    replicas: number;
    selector?: LabelSelector;
    updateStrategy?: StatefulSetUpdateStrategy;
    serviceName: string;
    template: PodTemplateSpec;
    volumeClaimTemplates?: Array<PersistentVolumeClaim<Partial<ObjectMeta>>>;
}

export interface StatefulSet {
    metadata: ObjectMeta;
    spec: StatefulSetSpec;
}
