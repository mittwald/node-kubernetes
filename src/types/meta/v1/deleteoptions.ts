import { SelectorOptions } from "../../../client";

export interface Preconditions {
    uid: string;
}

export interface DeprecatedDeleteOptions {
    gracePeriodSeconds?: number;
    orphanDependents?: boolean;
    preconditions?: Preconditions;
}

export interface NewDeleteOptions {
    gracePeriodSeconds?: number;
    preconditions?: Preconditions;
    propagationPolicy?: "Orphan" | "Background" | "Foreground";
}

export type DeleteOptions = SelectorOptions & (DeprecatedDeleteOptions | NewDeleteOptions);
