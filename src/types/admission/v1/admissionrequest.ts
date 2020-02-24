import {GroupVersionKind, GroupVersionResource} from "../../meta/v1";
import { Operation } from ".";

export interface AdmissionRequest<TObject, TOptions = unknown> {
    uid: string;
    kind: GroupVersionKind;
    resource: GroupVersionResource;
    subResource?: string;
    requestKind?: GroupVersionKind;
    requestResource?: GroupVersionResource;
    requestSubResource?: string;

    name?: string;
    namespace?: string;
    operation: Operation;
    userInfo: unknown; // TODO: define typings for authentication/v1.UserInfo
    object?: TObject;
    oldObject?: TObject;
    dryRun?: boolean;
    options?: TOptions;
}
