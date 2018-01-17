import {ResourceRequirements} from "./container";
import {AccessMode} from "./persistentvolume";
import {LabelSelector, ObjectMeta} from "../../meta/v1";

export interface PersistentVolumeClaimSpec {
    accessModes: AccessMode[];
    resources: ResourceRequirements;
    selector?: LabelSelector;
    storageClassName?: string;
    volumeName?: string;
}

export interface PersistentVolumeClaim<M = ObjectMeta> {
    metadata: M;
    spec: PersistentVolumeClaimSpec;
}
