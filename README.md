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