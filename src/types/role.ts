import {ObjectMeta} from "./meta";
import {PolicyRule} from "./policyrule";

export interface Role {
    metadata: ObjectMeta;
    rules: PolicyRule[];
}

export interface Subject {
    kind: string;
    name: string;
    apiGroup?: string;
    namespace?: string;
}

export interface RoleRef {
    apiGroup: string;
    kind: string;
    name: string;
}

export interface RoleBinding {
    metadata: ObjectMeta;
    subjects: Subject[];
    roleRef: RoleRef;
}
