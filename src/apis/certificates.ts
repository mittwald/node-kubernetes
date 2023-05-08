import * as certsv1b1 from "../types/certificates/v1beta1";
import { IResourceClient } from "../resource";

export interface CertificatesV1beta1API {
    certificateSigningRequests(): IResourceClient<
        certsv1b1.CertificateSigningRequest,
        "CertificateSigningRequest",
        "certificates.k8s.io/v1beta1"
    >;
}

export interface CertificatesAPI {
    v1beta1(): CertificatesV1beta1API;
}
