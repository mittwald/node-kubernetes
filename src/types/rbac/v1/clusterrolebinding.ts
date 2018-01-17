import {ObjectMeta} from "../../meta/v1";
import {RoleRef} from "./roleref";
import {Subject} from "./subject";

export interface ClusterRoleBinding<M = ObjectMeta> {
    metadata: M;
    roleRef: RoleRef;
    subjects: Subject[];
}
