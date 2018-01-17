import {PodTemplateSpec} from "../../core/v1";
import {LabelSelector, ObjectMeta} from "../../meta/v1";
import {ResourceList} from "../../meta";

export interface OnDeleteDaemonSetUpdateStrategy {
    type: "OnDelete";
}

export interface RollingUpdateDaemonSetUpdateStrategy {
    type: "RollingUpdate";
    rollingUpdate?: {
        maxUnavailable: number|string;
    };
}

export type DaemonSetUpdateStrategy = OnDeleteDaemonSetUpdateStrategy | RollingUpdateDaemonSetUpdateStrategy;

export interface DaemonSetSpec {
    minReadySeconds?: number;
    revisionHistoryLimit?: number;
    selector?: LabelSelector;
    template: PodTemplateSpec;
    updateStrategy?: DaemonSetUpdateStrategy;
}

export interface DaemonSet {
    metadata: ObjectMeta;
    spec: DaemonSetSpec;
}

export type DaemonSetList = ResourceList<DaemonSet, "DaemonSetList", "apps/v1">;
