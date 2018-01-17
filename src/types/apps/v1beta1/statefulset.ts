import {LabelSelector, ObjectMeta} from "../../meta";
import {PodTemplateSpec} from "../../core/v1/pod";
import {PersistentVolumeClaim} from "../../core/v1/persistentvolume";

export type StatefulSetUpdateStrategy = {type: "OnDelete"} | {type: "RollingUpdate", rollingUpdate?: {partition: number}};

export interface StatefulSetSpec {
    replicas: number;
    selector?: LabelSelector;
    updateStrategy?: StatefulSetUpdateStrategy;
    serviceName: string;
    template: PodTemplateSpec;
    volumeClaimTemplates?: Array<PersistentVolumeClaim<Partial<ObjectMeta>>>;
}

export interface StatefulSet {
    metadata: ObjectMeta;
    spec: StatefulSetSpec;
}
