import {IKubernetesRESTClient} from "./client";
import {INamespacedResourceClient, IResourceClient, NamespacedResourceClient, ResourceClient} from "./resource";
import * as corev1 from "./types/core/v1";
import * as resourceAppsV1beta1 from "./apis/apps/v1beta1";
import * as resourceExtensionsV1beta1 from "./apis/extensions/v1beta1";
import {AppsAPI, BatchAPI, CoreAPI, ExtensionsAPI, RBACAPI} from "./apis";
import {MetadataObject} from "./types/meta";

export interface IKubernetesAPI {
    extend<C>(name: string, customResourceAPI: C): this & C;
    core(): CoreAPI;
    apps(): AppsAPI;
    batch(): BatchAPI;
    extensions(): ExtensionsAPI;
    rbac(): RBACAPI;
}

export class KubernetesAPI implements IKubernetesAPI {

    public constructor(private restClient: IKubernetesRESTClient) {
    }

    private nc<R extends MetadataObject, K, V, O extends R = R>(apiBaseURL: string, resourceBaseURL: string): INamespacedResourceClient<R, K, V, O> {
        return new NamespacedResourceClient(this.restClient, apiBaseURL, resourceBaseURL);
    }

    private c<R extends MetadataObject, K, V, O extends R = R>(apiBaseURL: string, resourceBaseURL: string): IResourceClient<R, K, V, O> {
        return new ResourceClient(this.restClient, apiBaseURL, resourceBaseURL);
    }

    public extend<C>(name: string, customResourceAPI: C): this & C {
        (this as any)[name] = () => (customResourceAPI as any)[name]();

        return this as any;
    }

    public core(): CoreAPI {
        return {
            v1: () => ({
                configMaps: () => this.nc("/api/v1", "/configmaps"),
                endpoints: () => this.nc("/api/v1", "/endpoints"),
                namespaces: () => this.c("/api/v1", "/namespaces"),
                nodes: () => this.c("/api/v1", "/nodes"),
                pods: () => this.nc("/api/v1", "/pods"),
                persistentVolumes: () => this.c("/api/v1", "/persistentvolumes"),
                persistentVolumeClaims: () => this.nc("/api/v1", "/persistentvolumeclaims"),
                services: (): INamespacedResourceClient<corev1.Service, "Service", "v1"> => {
                    const client = new NamespacedResourceClient<corev1.Service, "Service", "v1">(this.restClient, "/api/v1", "/services");
                    client.supportsCollectionDeletion = false;
                    return client;
                },
                secrets: () => this.nc("/api/v1", "/secrets"),
                serviceAccounts: () => this.nc("/api/v1", "/serviceaccounts"),
            }),
        };
    }

    public apps(): AppsAPI {
        return {
            v1: () => ({
                daemonSets: () => this.nc("/apis/apps/v1", "/daemonsets"),
                deployments: () => this.nc("/apis/apps/v1", "/deployments"),
                replicaSets: () => this.nc("/apis/apps/v1", "/replicasets"),
                statefulSets: () => this.nc("/apis/apps/v1", "/statefulsets"),
            }),
            v1beta1: () => ({
                deployments: () => new resourceAppsV1beta1.DeploymentResourceClient(this.restClient),
                statefulSets: () => new resourceAppsV1beta1.StatefulSetResourceClient(this.restClient),
            }),
        };
    }

    public batch(): BatchAPI {
        return {
            v1: () => ({
                jobs: () => this.nc("/apis/batch/v1", "/jobs"),
            }),
            v1beta1: () => ({
                cronJobs: () => this.nc("/apis/batch/v1beta1", "/cronjobs"),
            }),
        };
    }

    public extensions(): ExtensionsAPI {
        return {
            v1beta1: () => ({
                daemonSets: () => this.nc("/apis/extensions/v1beta1", "/daemonsets"),
                deployments: () => new resourceExtensionsV1beta1.DeploymentResourceClient(this.restClient),
                ingresses: () => this.nc("/apis/extensions/v1beta1", "/ingresses"),
                networkPolicies: () => this.nc("/apis/extensions/v1beta1", "/networkpolicies"),
                replicaSets: () => this.nc("/apis/extensions/v1beta1", "/replicasets"),
            }),
        };
    }

    public rbac(): RBACAPI {
        return {
            v1: () => ({
                clusterRoles: () => new ResourceClient(this.restClient, "/apis/rbac.authorization.k8s.io/v1", "/clusterroles"),
                clusterRoleBindings: () => new ResourceClient(this.restClient, "/apis/rbac.authorization.k8s.io/v1", "/clusterrolebindings"),
                roles: () => new NamespacedResourceClient(this.restClient, "/apis/rbac.authorization.k8s.io/v1", "/roles"),
                roleBindings: () => new NamespacedResourceClient(this.restClient, "/apis/rbac.authorization.k8s.io/v1", "/rolebindings"),
            }),
            v1beta1: () => ({
                roles: () => new NamespacedResourceClient(this.restClient, "/apis/rbac.authorization.k8s.io/v1beta1", "/roles"),
                roleBindings: () => new NamespacedResourceClient(this.restClient, "/apis/rbac.authorization.k8s.io/v1beta1", "/rolebindings"),
            }),
        };
    }

}
