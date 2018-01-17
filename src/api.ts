import {IKubernetesRESTClient} from "./client";
import {INamespacedResourceClient, IResourceClient, NamespacedResourceClient, ResourceClient} from "./resource";
import * as corev1 from "./types/core/v1";
import * as batchv1 from "./types/batch/v1";
import * as extv1b1 from "./types/extensions/v1beta1";
import * as rbacv1b1 from "./types/rbac/v1beta1";
import * as resourceAppsV1beta1 from "./apis/apps/v1beta1";
import {AppsAPI, BatchAPI, CoreAPI, ExtensionsAPI, RBACAPI} from "./apis";

export interface IKubernetesAPI {
    core(): CoreAPI;
    apps(): AppsAPI;
    batch(): BatchAPI;
    extensions(): ExtensionsAPI;
    rbac(): RBACAPI;
}

export class KubernetesAPI implements IKubernetesAPI {

    public constructor(private restClient: IKubernetesRESTClient) {
    }

    public core(): CoreAPI {
        return {
            v1: () => ({
                pods: (): INamespacedResourceClient<corev1.Pod, "Pod", "v1", corev1.PodWithStatus> =>
                    new NamespacedResourceClient(this.restClient, "/api/v1", "/pods"),
                configMaps: (): INamespacedResourceClient<corev1.ConfigMap, "ConfigMap", "v1"> =>
                    new NamespacedResourceClient(this.restClient, "/api/v1", "/configmaps"),
                endpoints: (): INamespacedResourceClient<corev1.Endpoint, "Endpoint", "v1"> =>
                    new NamespacedResourceClient(this.restClient, "/api/v1", "/endpoints"),
                namespaces: (): IResourceClient<corev1.Namespace, "Namespace", "v1"> =>
                    new ResourceClient(this.restClient, "/api/v1", "/namespaces"),
                persistentVolumes: (): IResourceClient<corev1.PersistentVolume, "PersistentVolume", "v1"> =>
                    new ResourceClient(this.restClient, "/api/v1", "/persistentvolumes"),
                persistentVolumeClaims: (): INamespacedResourceClient<corev1.PersistentVolumeClaim, "PersistentVolumeClaim", "v1"> =>
                    new NamespacedResourceClient(this.restClient, "/api/v1", "/persistentvolumeclaims"),
                services: (): INamespacedResourceClient<corev1.Service, "Service", "v1"> => {
                    const client = new NamespacedResourceClient<corev1.Service, "Service", "v1">(this.restClient, "/api/v1", "/services");
                    client.supportsCollectionDeletion = false;
                    return client;
                },
                secrets: (): INamespacedResourceClient<corev1.Secret, "Secret", "v1"> =>
                    new NamespacedResourceClient(this.restClient, "/api/v1", "/secrets"),
                serviceAccounts: (): INamespacedResourceClient<corev1.ServiceAccount, "ServiceAccount", "v1"> =>
                    new NamespacedResourceClient(this.restClient, "/api/v1", "/serviceaccounts"),
            }),
        };
    }

    public apps(): AppsAPI {
        return {
            v1beta1: () => ({
                deployments: (): resourceAppsV1beta1.DeploymentResourceClient =>
                    new resourceAppsV1beta1.DeploymentResourceClient(this.restClient),
                statefulSets: (): resourceAppsV1beta1.StatefulSetResourceClient =>
                    new resourceAppsV1beta1.StatefulSetResourceClient(this.restClient),
            }),
        };
    }

    public batch(): BatchAPI {
        return {
            v1: () => ({
                jobs: (): INamespacedResourceClient<batchv1.Job, "Job", "batch/v1"> =>
                    new NamespacedResourceClient(this.restClient, "/apis/batch/v1", "/jobs"),
            }),
        };
    }

    public extensions(): ExtensionsAPI {
        return {
            v1beta1: () => ({
                daemonSets: (): INamespacedResourceClient<extv1b1.DaemonSet, "DaemonSet", "extensions/v1beta1"> =>
                    new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/daemonsets"),
                ingresses: (): INamespacedResourceClient<extv1b1.Ingress, "Ingress", "extensions/v1beta1"> =>
                    new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/ingresses"),
                networkPolicies: (): INamespacedResourceClient<extv1b1.NetworkPolicy, "NetworkPolicy", "extensions/v1beta1"> =>
                    new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/networkpolicies"),
                replicaSets: (): INamespacedResourceClient<extv1b1.ReplicaSet, "ReplicaSet", "extensions/v1beta1"> =>
                    new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/replicasets"),
            }),
        };
    }

    public rbac(): RBACAPI {
        return {
            v1beta1: () => ({
                roles: (): INamespacedResourceClient<rbacv1b1.Role, "Role", "rbac.authorization.k8s.io/v1beta1"> =>
                    new NamespacedResourceClient(this.restClient, "/apis/rbac.authorization.k8s.io/v1beta1", "/roles"),
                roleBindings: (): INamespacedResourceClient<rbacv1b1.RoleBinding, "RoleBinding", "rbac.authorization.k8s.io/v1beta1"> =>
                    new NamespacedResourceClient(this.restClient, "/apis/rbac.authorization.k8s.io/v1beta1", "/rolebindings"),
            }),
        };
    }

}
