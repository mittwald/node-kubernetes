import {CauseType} from "./causetype";

export interface StatusCause {
    type?: CauseType;
    message?: string;
    field?: string;
}
