/* eslint-disable @typescript-eslint/naming-convention */
import { ObjectMeta } from "../../meta/v1";
import { Schema } from "jsonschema";
import { WebhookClientConfig } from "../../admissionregistration/v1";

export interface CustomResourceDefinition {
    description?: string;
    kind?: string;
    metadata: ObjectMeta;
    spec: CustomResourceDefinitionSpec;
    status?: string;
}

export interface WebhookConversion {
    clientConfig?: WebhookClientConfig;
    conversionReviewVersions: string[];
}

export interface CustomResourceConversion {
    strategy: "None" | "Webhook";
    webhook?: WebhookConversion;
}

export interface CustomResourceDefinitionSpec {
    conversion?: CustomResourceConversion;
    group: string;
    names: CustomResourceDefinitionNames;
    preserveUnknownFields?: boolean;
    scope: "Namespaced" | "Cluster";
    versions: CustomResourceDefinitionVersion[];
}

export interface CustomResourceColumnDefinition {
    description?: string;
    format?: string;
    jsonPath: string;
    name: string;
    priority?: number;
    type: string;
}

export interface CustomResourceDefinitionNames {
    categories?: string[];
    kind: string;
    listKind?: string;
    plural: string;
    shortNames?: string[];
    singular?: string;
}

export interface CustomResourceSubresources {
    status?: CustomResourceSubresourceStatus;
    scale?: CustomResourceSubresourceScale;
}

export interface CustomResourceSubresourceStatus {}

export interface CustomResourceSubresourceScale {
    labelSelectorPath: string;
    specReplicasPath: string;
    statusReplicasPath: string;
}

export interface ExternalDocumentation {
    description: string;
    url: string;
}

export interface CustomResourceValidation {
    openAPIV3Schema: Schema & {
        // represents any valid JSON value. These types are supported: bool, int64, float64, string, []interface{}, map[string]interface{} and nil.
        default?: any;
        example?: any;
        externalDocs?: ExternalDocumentation;
        nullable?: boolean;

        "x-kubernetes-embedded-resource"?: boolean;
        "x-kubernetes-int-or-string"?: boolean;
        "x-kubernetes-list-map-keys"?: string[];
        "x-kubernetes-list-type"?: "atomic" | "set" | "map";
        "x-kubernetes-map-type"?: "granular" | "atomic";
        "x-kubernetes-preserve-unknown-fields"?: boolean;
    };
}

export interface CustomResourceDefinitionVersion {
    additionalPrinterColumns?: CustomResourceColumnDefinition[];
    deprecated?: boolean;
    deprecationWarning?: string;
    name: string;
    schema?: CustomResourceValidation;
    served: boolean;
    storage: boolean;
    subresources?: CustomResourceSubresources;
}
