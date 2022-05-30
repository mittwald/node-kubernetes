import {AdmissionRequest} from "./admissionrequest";
import {AdmissionResponse} from "./admissionresponse";
import {Resource} from "../../meta";
import {apiGroup} from "./group";

export const admissionReviewKind = "AdmissionReview";

export type AdmissionReview<TObject> = Resource<typeof admissionReviewKind, typeof apiGroup> & ({
    request: AdmissionRequest<TObject>;
} | {
    response: AdmissionResponse;
});
