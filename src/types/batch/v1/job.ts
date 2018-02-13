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

export interface JobCondition {
    lastProbeTime?: string;
    lastTransitionTime?: string;
    message?: string;
    reason?: string;
    status?: boolean | "Unknown";
    type?: string;
}

export interface JobStatus {
    startTime: string;
    active: number;
    failed: number;
    completionTime?: string;
    conditions?: JobCondition[];
    succeeded?: number;
}

export interface Job {
    metadata: ObjectMeta;
    spec: JobSpec;
}

export type JobWithStatus = Job & {status: JobStatus};

export type JobList = ResourceList<Job, "Job", "batch/v1">;
