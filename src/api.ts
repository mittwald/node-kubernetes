import {IKubernetesRESTClient} from "./client";
import {INamespacedResourceClient, IResourceClient, NamespacedResourceClient, ResourceClient} from "./resource";
import {
    ConfigMap,
    Ingress,
    Namespace,
    PersistentVolume,
    PersistentVolumeClaim,
    Pod,
    ReplicaSet,
    Secret,
    Service,
} from "./types";
import {DeploymentResourceClient} from "./resource/deployment";
import {StatefulSetResourceClient} from "./resource/statefulset";
import {Job} from "./types/job";
import {DaemonSet} from "./types/daemonset";
import {Endpoint} from "./types/endpoint";

export interface IKubernetesAPI {
    pods(): INamespacedResourceClient<Pod, "Pod", "v1">;
    configMaps(): INamespacedResourceClient<ConfigMap, "ConfigMap", "v1">;
    daemonSets(): INamespacedResourceClient<DaemonSet, "DaemonSet", "extensions/v1beta1">;
    deployments(): DeploymentResourceClient;
    endpoints(): INamespacedResourceClient<Endpoint, "Endpoint", "v1">;
    ingresses(): INamespacedResourceClient<Ingress, "Ingress", "extensions/v1beta1">;
    jobs(): INamespacedResourceClient<Job, "Job", "batch/v1">;
    namespaces(): IResourceClient<Namespace, "Namespace", "v1">;
    persistentVolumes(): IResourceClient<PersistentVolume, "PersistentVolume", "v1">;
    persistentVolumeClaims(): INamespacedResourceClient<PersistentVolumeClaim, "PersistentVolumeClaim", "v1">;
    replicaSets(): INamespacedResourceClient<ReplicaSet, "ReplicaSet", "extensions/v1beta1">;
    services(): INamespacedResourceClient<Service, "Service", "v1">;
    statefulSets(): StatefulSetResourceClient;
    secrets(): INamespacedResourceClient<Secret, "Secret", "v1">;
}

export class KubernetesAPI implements IKubernetesAPI {

    public constructor(private restClient: IKubernetesRESTClient) {
    }

    public pods(): INamespacedResourceClient<Pod, "Pod", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/pods");
    }

    public configMaps(): INamespacedResourceClient<ConfigMap, "ConfigMap", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/configmaps");
    }

    public daemonSets(): INamespacedResourceClient<DaemonSet, "DaemonSet", "extensions/v1beta1"> {
        return new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/daemonsets");
    }

    public deployments(): DeploymentResourceClient {
        return new DeploymentResourceClient(this.restClient);
    }

    public endpoints(): INamespacedResourceClient<Endpoint, "Endpoint", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/endpoints");
    }

    public ingresses(): INamespacedResourceClient<Ingress, "Ingress", "extensions/v1beta1"> {
        return new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/ingresses");
    }

    public jobs(): INamespacedResourceClient<Job, "Job", "batch/v1"> {
        return new NamespacedResourceClient(this.restClient, "/apis/batch/v1", "/jobs");
    }

    public namespaces(): IResourceClient<Namespace, "Namespace", "v1"> {
        return new ResourceClient(this.restClient, "/api/v1", "/namespaces");
    }

    public persistentVolumes(): IResourceClient<PersistentVolume, "PersistentVolume", "v1"> {
        return new ResourceClient(this.restClient, "/api/v1", "/persistentvolumes");
    }

    public persistentVolumeClaims(): INamespacedResourceClient<PersistentVolumeClaim, "PersistentVolumeClaim", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/persistentvolumeclaims");
    }

    public replicaSets(): INamespacedResourceClient<ReplicaSet, "ReplicaSet", "extensions/v1beta1"> {
        return new NamespacedResourceClient(this.restClient, "/apis/extensions/v1beta1", "/replicasets");
    }

    public services(): INamespacedResourceClient<Service, "Service", "v1"> {
        const client = new NamespacedResourceClient(this.restClient, "/api/v1", "/services");
        client.supportsCollectionDeletion = false;
        return client;
    }

    public statefulSets(): StatefulSetResourceClient {
        return new StatefulSetResourceClient(this.restClient);
    }

    public secrets(): INamespacedResourceClient<Secret, "Secret", "v1"> {
        return new NamespacedResourceClient(this.restClient, "/api/v1", "/secrets");
    }
}
