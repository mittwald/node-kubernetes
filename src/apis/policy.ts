import { INamespacedResourceClient } from "../resource";
import * as policyv1b1 from "../types/policy/v1beta1";

export interface PolicyAPI {
    v1beta1(): PolicyV1beta1API;
}

export interface PolicyV1beta1API {
    podDisruptionBudgets(): INamespacedResourceClient<
        policyv1b1.PodDisruptionBudget,
        "PodDisruptionBudget",
        "policy/v1beta1"
    >;
}
