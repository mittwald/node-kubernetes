import {LabelSelector, ObjectMeta, ResourceList} from "./meta";
import {PodTemplateSpec} from "./pod";

export interface JobSpec {
    activeDeadlineSeconds?: number;
    completions?: number;
    manualSelector?: boolean;
    parallelism?: number;
    selector?: LabelSelector;
    template: PodTemplateSpec;
}

export interface Job {
    metadata: ObjectMeta;
    spec: JobSpec;
}

export type JobList = ResourceList<Job, "Job", "batch/v1">;
