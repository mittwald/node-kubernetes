import { ResourceList } from "../../meta";
import { LabelSelector, ObjectMeta } from "../../meta/v1";
import { PodTemplateSpec } from "../../core/v1";

export interface OnDeleteDaemonSetUpdateStrategy {
    type: "OnDelete";
}

export interface RollingUpdateDaemonSetUpdateStrategy {
    type: "RollingUpdate";
    rollingUpdate?: {
        maxUnavailable: number | string;
    };
}

export type DaemonSetUpdateStrategy = OnDeleteDaemonSetUpdateStrategy | RollingUpdateDaemonSetUpdateStrategy;

export interface DaemonSetSpec {
    minReadySeconds?: number;
    selector?: LabelSelector;
    template: PodTemplateSpec;
    readonly templateGeneration?: number;
    updateStrategy?: DaemonSetUpdateStrategy;
}

export interface DaemonSet {
    metadata: ObjectMeta;
    spec: DaemonSetSpec;
}

export type DaemonSetList = ResourceList<DaemonSet, "DaemonSetList", "extensions/v1beta1">;
