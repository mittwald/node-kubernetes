import {ObjectMeta} from "../../meta/v1";
import {Secret} from "./secret";

export interface ServiceAccount {
    metadata: ObjectMeta;
    secrets?: Secret[];
    automountServiceAccountToken?: boolean;
}
