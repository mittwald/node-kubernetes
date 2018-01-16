# Kubernetes client for Node.JS

## Setup

External configuration using a `kubeconfig` file:

```typescript
import {FileBasedConfig, KubernetesRESTClient, KubernetesAPI} from "@mittwald/kubernetes";

const config = new FileBasedConfig("/home/mhelmich/.kube/config");
const client = new KubernetesRESTClient(config);
const api = new KubernetesAPI(client);
```

Internal configuration (when the client is running within a Kubernetes cluster):

```typescript
import {InClusterConfig, KubernetesRESTClient, KubernetesAPI} from "@mittwald/kubernetes";

const config = new InClusterConfig();
const client = new KubernetesRESTClient(config);
const api = new KubernetesAPI(client);
```

## Usage

```typescript
api.pods.namespace("default").list().then(pods => {
    console.log("Found " + pods.length + " Pods:");

    pods.forEach(pod => {
        console.log(pod.metadata.name);
    });
});
```

## Watching resources

```typescript
api.pods.namespace("default").watch({"some-label": "foo"}, ev => {
    console.log(`Pod: ${ev.type}: ${ev.object}`);    
});
```

## Rate-limiting API access

```typescript
import {
    InClusterConfig, 
    KubernetesRESTClient, 
    RatelimitingKubernetesRESTClient, 
    KubernetesAPI,
} from "@mittwald/kubernetes";

const config = new InClusterConfig();
const client = new KubernetesRESTClient(config);
const limitedClient = new RatelimitingKubernetesRESTClient(client);
const api = new KubernetesAPI(limitedClient);
```

## Supported Resources

Supported:

- ConfigMaps
- DaemonSets
- Deployments
- Endpoints
- Ingresses
- Jobs
- Namespaces
- PersistentVolumes
- PersistentVolumeClaims
- Pods
- ReplicaSets
- Secrets
- Services
- StatefulSets

Todo:

- Events
- HorizontalPodAutoscalers
- NetworkPolicies
- PodDisruptionBudgets
- ReplicationControllers
- ResourceQuotas
- StorageClasses

## References

- https://kubernetes.io/docs/api-reference/v1.6
- https://github.com/kubernetes/community/blob/master/contributors/devel/api-conventions.md