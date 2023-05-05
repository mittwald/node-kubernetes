import { ObjectMeta } from "../../meta/v1";
import { PolicyRule } from "./policyrule";

export interface Role {
    metadata: ObjectMeta;
    rules: PolicyRule[];
}
