import { LabelSelector, ObjectMeta } from "../../meta/v1";

export interface PodDisruptionBudget {
    metadata: ObjectMeta;
    spec: PodDisruptionBudgetSpec;
}

export type PodDisruptionBudgetSpec = {
    selector: LabelSelector;
} & (
    | {
          maxUnavailable: number | string;
      }
    | {
          minAvailable: number | string;
      }
);
