import { Status } from "../../meta/v1";
import { PatchType } from ".";

export interface AdmissionResponse {
    uid: string;
    allowed: boolean;
    status?: Status;
    patch?: string;
    patchType?: PatchType;
    auditAnnotations?: { [k: string]: string };
}
