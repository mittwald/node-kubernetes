import { ResourceList } from "../../meta";
import { Affinity } from "./affinity";
import { Container, SELinuxOptions } from "./container";
import { PersistentVolumeSource } from "./persistentvolume";
import { ObjectMeta } from "../../meta/v1";
import { LocalObjectReference } from "./localobjectreference";

export interface Pod {
    metadata: ObjectMeta;
    spec: PodSpec;
}

export interface PodSecurityContext {
    fsGroup?: number;
    runAsNonRoot?: boolean;
    runAsUser?: number;
    seLinuxOptions?: SELinuxOptions;
    supplementalGroups?: number[];
}

export interface Toleration {
    effect?: "" | "NoSchedule" | "PreferNoSchedule" | "NoExecute";
    key?: string;
    operator?: "Exists" | "Equal";
    tolerationSeconds?: number;
    value?: string;
}

export interface KeyToPath {
    key: string;
    mode?: number;
    path: string;
}

export interface SecretVolumeSource {
    defaultMode?: number;
    items?: KeyToPath[];
    optional?: boolean;
    secretName: string;
}

export interface ConfigMapVolumeSource {
    defaultMode?: number;
    items?: KeyToPath[];
    optional?: boolean;
    name: string;
}

export interface PersistentVolumeClaimVolumeSource {
    claimName: string;
    readOnly?: boolean;
}

export type VolumeSource =
    | PersistentVolumeSource
    | { secret: SecretVolumeSource }
    | { configMap: ConfigMapVolumeSource }
    | { persistentVolumeClaim: PersistentVolumeClaimVolumeSource };
export type Volume = { name: string } & VolumeSource;

export interface PodSpec {
    activeDeadlineSeconds?: number;
    affinity?: Affinity;
    automountServiceAccountToken?: boolean;
    containers: Container[];
    dnsPolicy?: "ClusterFirstwithHostNet" | "ClusterFirst" | "Default";
    hostIPC?: boolean;
    hostNetwork?: boolean;
    hostPID?: boolean;
    hostname?: string;
    imagePullSecrets?: LocalObjectReference[];
    initContainers?: Container[];
    nodeName?: string;
    nodeSelector?: { [label: string]: string };
    restartPolicy?: "Always" | "OnFailure" | "Never";
    schedulerName?: string;
    securityContext?: PodSecurityContext;
    serviceAccountName?: string;
    subdomain?: string;
    terminationGracePeriodSeconds?: number;
    tolerations?: Toleration[];
    volumes?: Volume[];
}

export interface PodStatus {
    conditions: PodCondition[];
    containerStatuses?: ContainerStatus[];
    hostIP: string;
    initContainerStatuses?: ContainerStatus[];
    message: string;
    phase: "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";
    podIP: string;
    qosClass: "BestEffort" | "Burstable" | "Guaranteed";
    reason: string;
    startTime: string;
}

export interface PodCondition {
    lastProbeTime: string;
    lastTransitionTime: string;
    message: string;
    reason: string;
    status: "True" | "False" | "Unknown";
    type: "Ready" | "Initialized" | "PodScheduled";
}

export interface ContainerStatus {
    containerID: string;
    image: string;
    imageID: string;
    lastState: ContainerState;
    name: string;
    ready: boolean;
    restartCount: number;
    state: ContainerState;
}

export type ContainerState =
    | { running: ContainerStateRunning }
    | { terminated: ContainerStateTerminated }
    | { waiting: ContainerStateWaiting }
    | Record<string, never>;

export interface ContainerStateRunning {
    startedAt: string;
}

export interface ContainerStateTerminated {
    containerID: string;
    exitCode: number;
    finishedAt: string;
    message: string;
    reason: string;
    signal: number;
    startedAt: string;
}

export interface ContainerStateWaiting {
    message: string;
    reason: string;
}

export interface PodTemplateSpec {
    metadata: Partial<ObjectMeta>;
    spec: PodSpec;
}

export type PodList = ResourceList<Pod, "PodList", "v1">;

export type PodWithStatus = Pod & { status: PodStatus };
