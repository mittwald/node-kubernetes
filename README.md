# Kubernetes client for Node.JS

[![npm version](https://badge.fury.io/js/%40mittwald%2Fkubernetes.svg)](https://www.npmjs.com/package/@mittwald/kubernetes)
[![Build Status](https://travis-ci.org/mittwald/node-kubernetes.svg?branch=master)](https://travis-ci.org/mittwald/node-kubernetes)

## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Setup](#setup)
  - [General usage](#general-usage)
  - [Rate-limiting API access](#rate-limiting-api-access)
  - [Watching resources](#watching-resources)
  - [Accessing CRDs](#accessing-crds)
- [Supported resources](#supported-resources)
- [References](#references)

## Installation

You can install this package via NPM:

    $ npm install @mittwald/kubernetes

## Usage

### Setup

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

### General usage

```typescript
api.core().v1().pods.namespace("default").list().then(pods => {
    console.log("Found " + pods.length + " Pods:");

    pods.forEach(pod => {
        console.log(pod.metadata.name);
    });
});
```

### Rate-limiting API access

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

### Watching resources

```typescript
api.core().v1().pods.namespace("default").watch({"some-label": "foo"}, ev => {
    console.log(`Pod: ${ev.type}: ${ev.object}`);    
});
```

### Accessing CRDs

If you have a package that offers a client for _Custom Resource Definitions_
(take a look at the [@mittwald/kubernetes-rook](https://github.com/mittwald/node-kubernetes-rook)
package as an example), you can use the `extend` method to add the respective
API client:

```typescript
import {RookCustomResourceAPI} from "@mittwald/kubernetes-rook";

// ...
let extendedAPI = api.extend("rook", new RookCustomResourceAPI(client));
```

## Supported resources

This library supports a reasonable subset of Kubernetes resources
(these were implemented on an as-needed basis). Feel free to open a
new issue or pull request to add support for additional API objects.

- core/v1
    - [x] pods
    - [x] configMaps
    - [x] endpoints
    - [x] namespaces
    - [x] nodes
    - [x] persistentVolumes
    - [x] persistentVolumeClaims
    - [x] services
    - [x] secrets
    - [x] serviceAccounts
- apps/v1
    - [x] daemonSets
    - [x] deployments
    - [x] replicaSets
    - [x] statefulSets
- apps/v1beta1
    - [x] deployments
    - [x] statefulSets
- batch/v1
    - [x] jobs
- batch/v1beta1
    - [x] cronJobs
- extensions/v1beta1
    - [x] daemonSets
    - [x] ingresses
    - [x] networkPolicies
    - [x] replicaSets
- rbac/v1
    - [x] clusterRoles
    - [x] clusterRoleBindings
    - [x] roles
    - [x] roleBindings
- autoscaling/v1
    - [x] horizontalPodAutoscalers
- apiextensions.k8s.io/v1beta1
    - [x] customResourceDefinitions
- admissionRegistration.k8s.io/v1
    - [x] validatingWebhookConfigurations
    - [ ] mutatingWebhookConfigurations

## References

- https://kubernetes.io/docs/api-reference/v1.9
- https://github.com/kubernetes/community/blob/master/contributors/devel/api-conventions.md
