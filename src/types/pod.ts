import {LocalObjectReference, ObjectMeta} from "./meta";
import {Affinity} from "./affinity";
import {Container, SELinuxOptions} from "./container";
import {PersistentVolumeSource} from "./persistentvolume";

export interface Pod {
    apiVersion: "v1";
    kind: "Pod";
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
    effect?: ""|"NoSchedule"|"PreferNoSchedule"|"NoExecute";
    key?: string;
    operator?: "Exists"|"Equal";
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

export type VolumeSource = PersistentVolumeSource | {secret: SecretVolumeSource} | {configMap: ConfigMapVolumeSource};
export type Volume = {name: string} & VolumeSource;

export interface PodSpec {
    activeDeadlineSeconds?: number;
    affinity?: Affinity;
    automountServiceAccountToken?: boolean;
    containers: Container[];
    dnsPolicy?: "ClusterFirstwithHostNet"|"ClusterFirst"|"Default";
    hostIPC?: boolean;
    hostNetwork?: boolean;
    hostPID?: boolean;
    hostname?: string;
    imagePullSecrets?: LocalObjectReference[];
    initContainers?: Container[];
    nodeName?: string;
    nodeSelector?: {[label: string]: string};
    restartPolicy?: "Always"|"OnFailure"|"Never";
    schedulerName?: string;
    securityContext?: PodSecurityContext;
    serviceAccountName?: string;
    subdomain?: string;
    terminationGracePeriodSeconds?: number;
    tolerations?: Toleration[];
    volumes?: Volume[];
}

export interface PodTemplateSpec {
    metadata: ObjectMeta;
    spec: PodSpec;
}
