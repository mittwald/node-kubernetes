import {ResourceList} from "../../meta";
import {LabelSelector, ObjectMeta} from "../../meta/v1";
import {PodTemplateSpec} from "../../core/v1";

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
