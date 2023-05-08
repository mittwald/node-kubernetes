import { PersistentVolumeClaim, PodTemplateSpec } from "../../core/v1";
import { LabelSelector, ObjectMeta } from "../../meta/v1";

export type StatefulSetUpdateStrategy =
    | { type: "OnDelete" }
    | { type: "RollingUpdate"; rollingUpdate?: { partition: number } };

export interface StatefulSetSpec {
    podManagementPolicy?: "OrderedReady" | "Parallel";
    replicas: number;
    revisionHistoryLimit?: number;
    selector?: LabelSelector;
    serviceName: string;
    template: PodTemplateSpec;
    updateStrategy?: StatefulSetUpdateStrategy;
    volumeClaimTemplates?: Array<PersistentVolumeClaim<Partial<ObjectMeta>>>;
}

export interface StatefulSet {
    metadata: ObjectMeta;
    spec: StatefulSetSpec;
}
