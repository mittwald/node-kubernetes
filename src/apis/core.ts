import { INamespacedResourceClient, IResourceClient } from "../resource";
import * as corev1 from "../types/core/v1";

export interface CoreV1API {
    pods(): INamespacedResourceClient<corev1.Pod, "Pod", "v1", corev1.PodWithStatus>;
    configMaps(): INamespacedResourceClient<corev1.ConfigMap, "ConfigMap", "v1">;
    endpoints(): INamespacedResourceClient<corev1.Endpoint, "Endpoint", "v1">;
    namespaces(): IResourceClient<corev1.Namespace, "Namespace", "v1">;
    nodes(): IResourceClient<corev1.Node, "Node", "v1">;
    persistentVolumes(): IResourceClient<corev1.PersistentVolume, "PersistentVolume", "v1">;
    persistentVolumeClaims(): INamespacedResourceClient<corev1.PersistentVolumeClaim, "PersistentVolumeClaim", "v1">;
    services(): INamespacedResourceClient<corev1.Service, "Service", "v1">;
    secrets(): INamespacedResourceClient<corev1.Secret, "Secret", "v1">;
    serviceAccounts(): INamespacedResourceClient<corev1.ServiceAccount, "ServiceAccount", "v1">;
}

export interface CoreAPI {
    v1(): CoreV1API;
}
