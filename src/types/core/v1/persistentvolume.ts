import {LabelSelector, MetadataObject, ObjectMeta, ResourceList} from "../../meta";
import {ResourceRequirements} from "./container";

export type AccessMode = "ReadWriteOnce"|"ReadOnlyMany"|"ReadWriteMany";

export interface PersistentVolumeSpecBase {
    accessModes: AccessMode[];
    capacity: {storage: string};
    persistentVolumeReclaimPolicy?: "Retain"|"Recycle"|"Delete";
    storageClassName?: string;
}

export interface AWSElasticBlockStoreVolumeSource {
    fsType?: "ext4"|"xfs"|"ntfs"|string;
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

export type PersistentVolumeSource =
    {awsElasticBlockStore: AWSElasticBlockStoreVolumeSource} |
    {hostPath: HostPathVolumeSource} |
    {nfs: NFSVolumeSource} |
    {quobyte: QuobyteVolumeSource};

export type PersistentVolumeSpec = PersistentVolumeSpecBase & PersistentVolumeSource;

export type PersistentVolume = MetadataObject & {
    spec: PersistentVolumeSpec;
};

export type PersistentVolumeList = ResourceList<PersistentVolume, "PersistentVolume", "v1">;
