import {LabelSelector, ObjectMeta} from "./meta";
import {PodTemplateSpec} from "./pod";
import {PersistentVolumeClaim} from "./persistentvolume";

export interface StatefulSetSpec {
    replicas: number;
    selector?: LabelSelector;
    serviceName: string;
    template: PodTemplateSpec;
    volumeClaimTemplates?: Array<PersistentVolumeClaim<Partial<ObjectMeta>>>;
}

export interface StatefulSet {
    metadata: ObjectMeta;
    spec: StatefulSetSpec;
}
