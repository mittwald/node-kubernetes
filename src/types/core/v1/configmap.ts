import {ObjectMeta} from "../../meta/v1";

export interface ConfigMap {
    metadata: ObjectMeta;
    data: {[key: string]: string};
}
