import {IKubernetesRESTClient, ListOptions, PatchKind, WatchOptions, WatchResult} from "./client";
import Bottleneck from "bottleneck";
import {DeleteOptions, WatchEvent} from "./types/meta/v1";
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

    public delete<R>(url: string, opts?: DeleteOptions, queryParams?: { [p: string]: string }, body?: any): Promise<R> {
        return this.limiter.schedule(() => this.inner.delete(url, opts, queryParams, body));
    }

    public get<R>(url: string, opts?: ListOptions): Promise<R | undefined> {
        return this.limiter.schedule(() => this.inner.get(url, opts));
    }

    public patch<R = any>(url: string, body: any, patchKind: PatchKind): Promise<R> {
        return this.limiter.schedule(() => this.inner.patch(url, body, patchKind));
    }

    public watch<R extends MetadataObject>(url: string, onUpdate: (o: WatchEvent<R>) => any, onError: (err: any) => any, opts?: WatchOptions): Promise<WatchResult> {
        return this.limiter.schedule(() => this.inner.watch(url, onUpdate, onError, opts));
    }
}
