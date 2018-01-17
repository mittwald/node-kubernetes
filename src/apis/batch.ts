import {INamespacedResourceClient} from "../resource";
import * as batchv1 from "../types/batch/v1";

export interface BatchV1API {
    jobs(): INamespacedResourceClient<batchv1.Job, "Job", "batch/v1">;
}

export interface BatchAPI {
    v1(): BatchV1API;
}
