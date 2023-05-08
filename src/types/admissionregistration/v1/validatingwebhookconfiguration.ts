import { MetadataObject } from "../../meta";
import { LabelSelector } from "../../meta/v1";

export const validatingWebhookConfigurationKind = "ValidatingWebhookConfiguration";
export type ValidatingWebhookConfigurationKind = typeof validatingWebhookConfigurationKind;

export type ValidatingWebhookConfiguration = MetadataObject & {
    webhooks?: ValidatingWebhook[];
};

export interface ValidatingWebhook {
    name: string;
    clientConfig: WebhookClientConfig;
    rules?: RuleWithOperations[];
    failurePolicy?: FailurePolicy;
    matchPolicy?: MatchPolicy;
    namespaceSelector?: LabelSelector;
    objectSelector?: LabelSelector;
    sideEffects: SideEffectClass;
    timeoutSeconds?: number;
    admissionReviewVersions: Array<"v1" | "v1beta">;
}

export type WebhookClientConfig = ({ url: string } | { service: ServiceReference }) & { caBundle?: string };

export interface ServiceReference {
    namespace: string;
    name: string;
    path?: string;
    port?: number;
}

export type RuleWithOperations = Rule & {
    operations: OperationType[];
};

export interface Rule {
    apiGroups: string[];
    apiVersions: string[];
    resources: string[];
    scope?: Scope;
}

export enum Scope {
    Cluster = "Cluster",
    Namespaced = "Namespaced",
    All = "*",
}

export enum OperationType {
    All = "*",
    Create = "CREATE",
    Update = "UPDATE",
    Delete = "DELETE",
    Connect = "CONNECT",
}

export enum FailurePolicy {
    Ignore = "Ignore",
    Fail = "Fail",
}

export enum MatchPolicy {
    Exact = "Exact",
    Equivalent = "Equivalent",
}

export enum SideEffectClass {
    Unknown = "Unknown",
    None = "None",
    Some = "Some",
    NoneOnDryRun = "NoneOnDryRun",
}
