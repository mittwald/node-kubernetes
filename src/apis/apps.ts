import * as resourceAppsV1beta1 from "./apps/v1beta1";

export interface AppsV1beta1API {
    deployments(): resourceAppsV1beta1.DeploymentResourceClient;
    statefulSets(): resourceAppsV1beta1.StatefulSetResourceClient;
}

export interface AppsAPI {
    v1beta1(): AppsV1beta1API;
}
