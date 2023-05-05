import * as resourceAppsV1beta1 from "./apps/v1beta1";
import * as appsv1 from "../types/apps/v1";
import { INamespacedResourceClient } from "../resource";

export interface AppsV1API {
    daemonSets(): INamespacedResourceClient<appsv1.DaemonSet, "DaemonSet", "apps/v1">;
    deployments(): INamespacedResourceClient<appsv1.Deployment, "Deployment", "apps/v1">;
    replicaSets(): INamespacedResourceClient<appsv1.ReplicaSet, "ReplicaSet", "apps/v1">;
    statefulSets(): INamespacedResourceClient<appsv1.StatefulSet, "StatefulSet", "apps/v1">;
}

export interface AppsV1beta1API {
    deployments(): resourceAppsV1beta1.DeploymentResourceClient;
    statefulSets(): resourceAppsV1beta1.StatefulSetResourceClient;
}

export interface AppsAPI {
    v1(): AppsV1API;
    v1beta1(): AppsV1beta1API;
}
