import * as admregv1 from "../types/admissionregistration/v1";
import { IResourceClient } from "../resource";

export interface AdmissionRegistrationV1API {
    validatingWebhookConfigurations(): IResourceClient<
        admregv1.ValidatingWebhookConfiguration,
        admregv1.ValidatingWebhookConfigurationKind,
        admregv1.APIGroup
    >;
}

export interface AdmissionRegistrationAPI {
    v1(): AdmissionRegistrationV1API;
}
