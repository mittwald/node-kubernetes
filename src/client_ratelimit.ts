import {IKubernetesRESTClient} from "./client";
import {LabelSelector} from "./label";
import {WatchEvent} from "./types";
import Bottleneck from "bottleneck";

export class RatelimitedKubernetesRESTClient implements IKubernetesRESTClient {
    private limiter: Bottleneck;

    public constructor(private inner: IKubernetesRESTClient, limiter?: Bottleneck) {
        if (!limiter) {
            limiter = new Bottleneck(2, 200);
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

    public watch<R>(url: string, onUpdate: (o: WatchEvent<R>) => any, onError: (err: any) => any, labelSelector?: LabelSelector): Promise<void> {
        return this.limiter.schedule(() => this.inner.watch(url, onUpdate, onError, labelSelector));
    }
}
