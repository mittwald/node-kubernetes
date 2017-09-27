import {ObjectMeta} from "./meta";

export interface Secret {
    metadata: ObjectMeta;
    type?: string;
    data?: {[key: string]: string};
}
