import {ObjectMeta} from "../../meta/v1";

export interface CrossVersionObjectReference {
    apiVersion: string;
    kind: string;
    name: string;
}

export interface HorizontalPodAutoscalerSpec {
    maxReplicas: number;
    minReplicas?: number;
    scaleTargetRef: CrossVersionObjectReference;
    targetCPUUtilizationPercentage?: number;
}

export interface HorizontalPodAutoscaler {
    metadata: ObjectMeta;
    spec: HorizontalPodAutoscalerSpec;
}
