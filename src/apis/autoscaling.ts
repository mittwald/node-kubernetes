import {INamespacedResourceClient} from "../resource";
import {HorizontalPodAutoscaler} from "../types/autoscaling/v1/horizontalpodautoscaler";

export interface AutoscalingV1API {
    horizontalPodAutoscalers(): INamespacedResourceClient<HorizontalPodAutoscaler, "HorizontalPodAutoscaler", "autoscaling/v1">;
}

export interface AutoscalingAPI {
    v1(): AutoscalingV1API;
}
