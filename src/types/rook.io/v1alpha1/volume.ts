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
