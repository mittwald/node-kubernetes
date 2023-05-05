import * as extv1b1 from "../types/extensions/v1beta1";
import { INamespacedResourceClient } from "../resource";

export interface ExtensionsV1beta1API {
    daemonSets(): INamespacedResourceClient<extv1b1.DaemonSet, "DaemonSet", "extensions/v1beta1">;
    deployments(): INamespacedResourceClient<extv1b1.Deployment, "Deployment", "extensions/v1beta1">;
    ingresses(): INamespacedResourceClient<extv1b1.Ingress, "Ingress", "extensions/v1beta1">;
    networkPolicies(): INamespacedResourceClient<extv1b1.NetworkPolicy, "NetworkPolicy", "extensions/v1beta1">;
    replicaSets(): INamespacedResourceClient<extv1b1.ReplicaSet, "ReplicaSet", "extensions/v1beta1">;
}

export interface ExtensionsAPI {
    v1beta1(): ExtensionsV1beta1API;
}
