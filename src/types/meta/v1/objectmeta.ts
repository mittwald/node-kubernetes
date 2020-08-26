export interface ObjectMeta {
    name: string;
    namespace?: string;
    generateName?: string;
    labels?: { [key: string]: string };
    annotations?: { [key: string]: string };
    resourceVersion?: string;
    finalizers?: string[];
    deletionTimestamp?: string;
    deletionGracePeriodSeconds?: number;
}
