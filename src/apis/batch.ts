import {INamespacedResourceClient} from "../resource";
import * as batchv1 from "../types/batch/v1";
import * as batchv1beta1 from "../types/batch/v1beta1";

export interface BatchV1API {
    jobs(): INamespacedResourceClient<batchv1.Job, "Job", "batch/v1">;
}

export interface BatchV1beta1API {
    cronJobs(): INamespacedResourceClient<batchv1beta1.CronJob, "CronJob", "batch/v1beta1">;
}

export interface BatchAPI {
    v1(): BatchV1API;
    v1beta1(): BatchV1beta1API;
}
