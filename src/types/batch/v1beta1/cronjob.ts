import { ObjectMeta } from "../../meta/v1";
import { JobSpec } from "../v1";

export interface JobTemplateSpec {
    metadata: ObjectMeta;
    spec: JobSpec;
}

export interface CronJobSpec {
    concurrencyPolicy?: "Allow" | "Forbid" | "Replace";
    failedJobsHistoryLimit?: number;
    jobTemplate: JobTemplateSpec;
    schedule: string;
    startingDeadlineSeconds?: number;
    successfulJobsHistoryLimit?: number;
    suspend?: boolean;
}

export interface CronJob {
    metadata: ObjectMeta;
    spec: CronJobSpec;
}
