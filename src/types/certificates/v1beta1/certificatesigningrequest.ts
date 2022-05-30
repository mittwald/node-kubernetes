import {ObjectMeta} from "../../meta/v1";
import {KeyUsage} from "./keyusage";
import {CertificateSigningRequestCondition} from "./certificatesigningrequestcondition";

export interface CertificateSigningRequest {
    metadata: ObjectMeta;
    spec: CertificateSigningRequestSpec;
    status?: CertificateSigningRequestStatus;
}

export interface CertificateSigningRequestSpec {
    request: string;
    usages: KeyUsage[];
    username?: string;
    uid?: string;
    groups?: string[];
    extra?: {[k: string]: string[]};
}

export interface CertificateSigningRequestStatus {
    conditions?: CertificateSigningRequestCondition[];
    certificate?: string;
}
