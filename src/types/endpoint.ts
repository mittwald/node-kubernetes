import {ObjectMeta, ObjectReference, ResourceList} from "./meta";

export interface EndpointAddress {
    hostname?: string;
    ip: string;
    nodeName?: string;
    targetRef?: ObjectReference;
}

export interface EndpointPort {
    name?: string;
    port?: number;
    protocol?: "TCP"|"UDP";
}

export interface EndpointSubset {
    addresses?: EndpointAddress[];
    nodReadyAddresses?: EndpointAddress[];
    ports?: EndpointPort[];
}

export interface Endpoint {
    metadata: ObjectMeta;
    subsets: EndpointSubset[];
}

export type EndpointsList = ResourceList<Endpoint, "EndpointsList", "v1">;
