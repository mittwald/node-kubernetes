export interface ConfigMapKeySelector {
    key: string;
    name: string;
    optional?: boolean;
}

export interface ObjectFieldSelector {
    apiVersion: string;
    fieldPath: string;
}

export interface ResourceFieldSelector {
    containerName?: string;
    divisor?: string;
    resource: string;
}

export interface SecretKeySelector {
    key: string;
    name: string;
    optional?: boolean;
}

export type EnvVarSource = {configMapKeyRef: ConfigMapKeySelector} |
    {fieldRef: ObjectFieldSelector} |
    {resourceFieldRef: ResourceFieldSelector} |
    {secretKeyRef: SecretKeySelector};

export type EnvVar = {name: string} & ({value: string} | {valueFrom: EnvVarSource});

export interface ConfigMapEnvSource {
    name: string;
    optional?: boolean;
}

export interface SecretEnvSource {
    name: string;
    optional?: boolean;
}

export type EnvFromSource = {prefix?: string} & ({configMapRef: ConfigMapEnvSource} | {secretRef: SecretEnvSource});

export interface ExecAction {
    command: string[];
}

export interface HTTPHeader {
    name: string;
    value: string;
}

export interface HTTPGetAction {
    host?: string;
    httpHeaders?: HTTPHeader[];
    path: string;
    port: number|string;
    scheme?: "HTTP"|"HTTPS";
}

export interface TCPSocketAction {
    port: number|string;
}

export type Handler = {exec: ExecAction} | {httpGet: HTTPGetAction} | {tcpSocket: TCPSocketAction};

export interface Lifecycle {
    postStart?: Handler;
    preStop?: Handler;
}

export type Probe = {
    failureThreshold?: number;
    initialDelaySeconds?: number;
    periodSeconds?: number;
    successThreshold?: number;
    timeoutSeconds?: number;
} & ({exec: ExecAction} | {httpGet: HTTPGetAction} | {tcpSocket: TCPSocketAction});

export interface ContainerPort {
    containerPort: number;
    hostIP?: string;
    hostPort?: number;
    name?: string;
    protocol?: "TCP"|"UDP";
}

export interface ResourceRequirements {
    limits?: {[resource: string]: string};
    requests?: {[resource: string]: string};
}

export interface Capabilities {
    add?: string[];
    drop?: string[];
}

export interface SELinuxOptions {
    level?: string;
    role?: string;
    type?: string;
    user?: string;
}

export interface SecurityContext {
    capabilities?: Capabilities;
    privileged?: boolean;
    readOnlyRootFilesystem?: boolean;
    runAsNonRoot?: boolean;
    runAsUser?: number;
    seLinuxOptions?: SELinuxOptions;
}

export interface VolumeMount {
    mountPath: string;
    name: string;
    readOnly?: boolean;
    subPath?: string;
}

export interface Container {
    args?: string[];
    command?: string[];
    env?: EnvVar[];
    envFrom?: EnvFromSource[];
    image: string;
    imagePullPolicy?: "Always"|"Never"|"IfNotPresent";
    lifecycle?: Lifecycle;
    livenessProbe?: Probe;
    name: string;
    ports?: ContainerPort[];
    readinessProbe?: Probe;
    resources?: ResourceRequirements;
    securityContext?: SecurityContext;
    stdin?: boolean;
    stdinOnce?: boolean;
    terminationMessagePath?: string;
    terminationMessagePolicy?: "File"|"FallbackToLogsOnError";
    tty?: boolean;
    volumeMounts?: VolumeMount[];
    workingDir?: string;
}
