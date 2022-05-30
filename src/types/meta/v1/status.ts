import {ListMeta} from "./listmeta";
import {StatusReason} from "./statusreason";
import {StatusDetails} from "./statusdetails";

export interface Status {
    metadata?: ListMeta;
    status?: string;
    message?: string;
    reason?: StatusReason;
    details?: StatusDetails;
    code?: number;
}
