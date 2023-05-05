import { ObjectMeta } from "../../meta/v1";
import { Schema } from "jsonschema";

export interface CustomResourceDefinition {
    metadata: ObjectMeta;
    spec: CustomResourceDefinitionSpec;
}

export type CustomResourceDefinitionSpec = {
    additionalPrinterColumns?: CustomResourceColumnDefinition[];
    group: string;
    names: CustomResourceDefinitionNames;
    scope?: "Namespaced" | "Cluster";
    subresources?: CustomResourceSubresources;
    validation?: CustomResourceValidation;
} & ({ version: string } | { versions: CustomResourceDefinitionVersion[] });

export interface CustomResourceColumnDefinition {
    JSONPath: string;
    description?: string;
    format?: string;
    name: string;
    priority?: number;
    type?: any;
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

export interface CustomResourceValidation {
    openAPIV3Schema: Schema;
}

export interface CustomResourceDefinitionVersion {
    name: string;
    served: boolean;
    storage: boolean;
}
