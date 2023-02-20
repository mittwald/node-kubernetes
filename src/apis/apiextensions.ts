import * as apiextv1b1 from "../types/apiextensions/v1beta1";
import * as apiextv1 from "../types/apiextensions/v1beta1";
import {IResourceClient} from "../resource";

export interface APIExtensionsV1beta1API {
    customResourceDefinitions(): IResourceClient<apiextv1b1.CustomResourceDefinition, "CustomResourceDefinitions", "apiextensions.k8s.io/v1beta1">;
}

export interface APIExtensionsV1API {
    customResourceDefinitions(): IResourceClient<apiextv1.CustomResourceDefinition, "CustomResourceDefinitions", "apiextensions.k8s.io/v1">;
}

export interface APIExtensionsAPI {
    v1beta1(): APIExtensionsV1beta1API;
    v1(): APIExtensionsV1API
}
