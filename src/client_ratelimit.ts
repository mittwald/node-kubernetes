import {IKubernetesRESTClient, WatchResult} from "./client";
import {LabelSelector} from "./label";
import Bottleneck from "bottleneck";
import {WatchEvent} from "./types/meta/v1";
import {MetadataObject} from "./types/meta";

export class RatelimitedKubernetesRESTClient implements IKubernetesRESTClient {
    private limiter: Bottleneck;

    public constructor(private inner: IKubernetesRESTClient, limiter?: Bottleneck) {
        if (!limiter) {
            limiter = new Bottleneck({
                maxConcurrent: 2,
                minTime: 200,
            });
        }

        this.limiter = limiter;
    }

    public post<R>(url: string, body: any): Promise<R> {
        return this.limiter.schedule(() => this.inner.post(url, body));
    }

    public put<R>(url: string, body: any): Promise<R> {
        return this.limiter.schedule(() => this.inner.put(url, body));
    }

    public delete<R>(url: string, labelSelector?: LabelSelector, queryParams?: { [p: string]: string }, body?: any): Promise<R> {
        return this.limiter.schedule(() => this.inner.delete(url, labelSelector, queryParams, body));
    }

    public get<R>(url: string, labelSelector?: LabelSelector): Promise<R | undefined> {
        return this.limiter.schedule(() => this.inner.get(url, labelSelector));
    }

    public watch<R extends MetadataObject>(url: string, onUpdate: (o: WatchEvent<R>) => any, onError: (err: any) => any, labelSelector?: LabelSelector): Promise<WatchResult> {
        return this.limiter.schedule(() => this.inner.watch(url, onUpdate, onError, labelSelector));
    }
}
