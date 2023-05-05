import { StatusCause } from "./statuscause";

export interface StatusDetails {
    name?: string;
    group?: string;
    kind?: string;
    uid?: string;
    causes?: StatusCause[];
    retryAfterSeconds?: number;
}
