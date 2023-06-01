import { Resource } from "../../meta";

export declare const apiGroup = "apiextensions.k8s.io/v1";

export declare type ConversionResponseStatus = {
    status: "Success" | "Failed";
    message?: string;
};

export declare const conversionReviewKind = "ConversionReview";
export declare type ConversionReview<TRequest, TResponse> = Resource<typeof conversionReviewKind, typeof apiGroup> &
    (
        | {
              request: ConversionRequest<TRequest>;
          }
        | {
              response: ConversionResponse<TResponse>;
          }
    );

export interface ConversionRequest<TObject> {
    uid: string;
    desiredAPIVersion: string;
    objects: TObject[];
}

export interface ConversionResponse<TObject> {
    uid: string;
    convertedObjects?: TObject[];
    result: ConversionResponseStatus;
}
