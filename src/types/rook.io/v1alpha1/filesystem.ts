import {NodeAffinity, PodAffinity, PodAntiAffinity} from "../../core/v1/affinity";
import {Toleration, ResourceRequirements} from "../../core/v1";
import {Resource} from "../../meta";
import {ObjectMeta} from "../../meta/v1";


export interface ErasureCodedSpec {
    codingChunks: number;
    dataChunks: number;
    algorithm: string;
}

export interface ReplicatedSpec {
    size: number;
}

export interface PoolSpec {
    failureDomain: string;
    crushRoot: string;
    replicated: ReplicatedSpec;
    erasureCoded: ErasureCodedSpec;
}

export interface Placement {
    kind: string;
    apiVersion: string;
    nodeAffinity?: NodeAffinity;
    podAffinity?: PodAffinity;
    podAntiAffinity?: PodAntiAffinity;
    tolerations?: Toleration[];
}

export interface MetadataServerSpec {
    activeCount: number;
    activeStandby: boolean;
    placement?: Placement;
    resources?: ResourceRequirements;
}

export interface FilesystemSpec {
    metadataPool: PoolSpec;
    dataPools: PoolSpec[];
    metadataServer: MetadataServerSpec;
}

export interface Filesystem {
    kind: "Filesystem";
    apiVersion: "rook.io/v1alpha1";
    metadata: ObjectMeta;
    spec: FilesystemSpec;
}