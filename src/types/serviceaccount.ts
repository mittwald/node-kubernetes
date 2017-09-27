import {ObjectMeta} from "./meta";
import {Secret} from "./secret";

export interface ServiceAccount {
    metadata: ObjectMeta;
    secrets?: Secret[];
    automountServiceAccountToken?: boolean;
}
