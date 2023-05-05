import { MetadataObject, ResourceList } from "../../meta";
import { LocalObjectReference } from "./localobjectreference";

export type AccessMode = "ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany";

export interface PersistentVolumeSpecBase {
    accessModes: AccessMode[];
    capacity: { storage: string };
    persistentVolumeReclaimPolicy?: "Retain" | "Recycle" | "Delete";
    storageClassName?: string;
}

export interface AWSElasticBlockStoreVolumeSource {
    fsType?: "ext4" | "xfs" | "ntfs" | string;
    partition?: number;
    readOnly?: boolean;
    volumeID: string;
}

export interface HostPathVolumeSource {
    path: string;
}

export interface NFSVolumeSource {
    path: string;
    server: string;
    readOnly?: boolean;
}

export interface QuobyteVolumeSource {
    group?: string;
    readOnly?: boolean;
    registry: string;
    user?: string;
    volume: string;
}

export interface FlexVolumeSource {
    driver: string;
    fsType?: string;
    secretRef?: LocalObjectReference;
    readOnly?: boolean;
    options?: { [name: string]: string };
}

export type PersistentVolumeSource =
    | { awsElasticBlockStore: AWSElasticBlockStoreVolumeSource }
    | { hostPath: HostPathVolumeSource }
    | { emptyDir: Record<string, never> }
    | { nfs: NFSVolumeSource }
    | { quobyte: QuobyteVolumeSource }
    | { flexVolume: FlexVolumeSource };

export type PersistentVolumeSpec = PersistentVolumeSpecBase & PersistentVolumeSource;

export type PersistentVolume = MetadataObject & {
    spec: PersistentVolumeSpec;
};

export type PersistentVolumeList = ResourceList<PersistentVolume, "PersistentVolume", "v1">;
