import {ObjectMeta} from "../../meta/v1";

export interface Secret {
    metadata: ObjectMeta;
    type?: string;
    data?: {[key: string]: string};
}
