import { PodTemplateSpec } from "../../core/v1";
import { LabelSelector, ObjectMeta } from "../../meta/v1";

export interface RollbackConfig {
    revision: number;
}

export interface DeploymentStrategy {
    type?: "Recreate" | "RollingUpdate";
    rollingUpdate?: {
        maxSurge: number | string;
        maxUnavailable: number | string;
    };
}

export interface DeploymentSpec {
    minReadySeconds?: number;
    paused?: boolean;
    progressDeadlineSeconds?: number;
    replicas?: number;
    revisionHistoryLimit?: number;
    rollbackTo?: RollbackConfig;
    selector?: LabelSelector;
    strategy?: DeploymentStrategy;
    template: PodTemplateSpec;
}

export interface Deployment {
    metadata: ObjectMeta;
    spec: DeploymentSpec;
}
