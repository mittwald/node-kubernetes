import { LabelSelector, ObjectMeta } from "../../meta/v1";
import { PolicyRule } from "./policyrule";

export interface AggregationRule {
    clusterRoleSelectors?: LabelSelector[];
}

export interface ClusterRole<M = ObjectMeta> {
    metadata: M;
    aggregationRule?: AggregationRule;
    rules: PolicyRule[];
}
