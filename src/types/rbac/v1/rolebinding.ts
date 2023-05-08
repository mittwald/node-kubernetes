import { ObjectMeta } from "../../meta/v1";
import { Subject } from "./subject";
import { RoleRef } from "./roleref";

export interface RoleBinding {
    metadata: ObjectMeta;
    subjects: Subject[];
    roleRef: RoleRef;
}
