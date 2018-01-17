import {ObjectMeta, ResourceList} from "../../meta";

export interface ServiceSpecClusterIP {
    type?: "ClusterIP";
    clusterIP?: ""|"None"|string;
    selector: {[label: string]: string};
}

export interface ServiceSpecExternalName {
    type: "ExternalName";
    externalName: string;
}

export interface ServiceSpecLoadBalancer {
    type: "LoadBalancer";
    loadBalancerIP?: string;
    loadBalancerSourceRanges?: string[];
    selector: {[label: string]: string};
}

export interface ServiceSpecNodePort {
    type: "NodePort";
    selector: {[label: string]: string};
}

export interface ServicePort {
    name?: string;
    nodePort?: number;
    port?: number;
    protocol?: "TCP"|"UDP";
    targetPort?: number;
}

export type ServiceSpec = (ServiceSpecClusterIP|ServiceSpecExternalName|ServiceSpecLoadBalancer|ServiceSpecNodePort) & {
    externalIPs?: string[];
    ports?: ServicePort[];
    sessionAffinity?: "ClientIP"|"None";
};

export interface Service {
    metadata: ObjectMeta;
    spec: ServiceSpec;
}

export type ServiceList = ResourceList<Service, "ServiceList", "v1">;
