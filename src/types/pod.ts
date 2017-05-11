import {ObjectMeta} from "./meta";

export interface Port {
    containerPort: number;
    name?: string;
    protocol?: "TCP"|"UDP";
}

export interface ContainerSpec {
    name: string;
    image: string;
    ports?: Port[];
    volumeMounts?: {
        name: string;
        mountPath: string;
        readOnly?: boolean;
    }[]
}

export interface SecretVolumeSpec {
    name: string;
    secret: {
        secretName: string;
    }
}

export type VolumeSpec = SecretVolumeSpec;

export interface Pod {
    apiVersion: "v1",
    kind: "Pod",
    metadata: ObjectMeta,
    spec: {
        volumes?: VolumeSpec[];
        containers?: ContainerSpec[];
    }
}