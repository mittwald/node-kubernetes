import * as v1 from "../../core/v1";

export interface LocalObjectReference {
    name: string;
}

export interface FlexVolumeSource {
    driver: string;
    fsType: string;
    secretRef?: LocalObjectReference;
    readOnly?: boolean;
    options?: {[name: string]: string}
}

export type PersistentVolume = v1.PersistentVolume | {flexVolume: FlexVolumeSource};