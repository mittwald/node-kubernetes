import {ObjectMeta} from "../../meta";

export interface ConfigMap {
    metadata: ObjectMeta;
    data: {[key: string]: string};
}
