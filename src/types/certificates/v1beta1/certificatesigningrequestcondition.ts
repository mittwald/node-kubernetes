import {RequestConditionType} from "./requestconditiontype";

export interface CertificateSigningRequestCondition {
    type: RequestConditionType;
    reason?: string;
    message?: string;
    lastUpdateTIme?: string;
}
