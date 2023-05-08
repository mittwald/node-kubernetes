import { IKubernetesRESTClient, ListOptions, PatchKind, WatchOptions, WatchResult } from "./client";
import { Counter, Histogram, Registry } from "prom-client";
import { DeleteOptions, WatchEvent } from "./types/meta/v1";
import { MetadataObject } from "./types/meta";

const apiMetricLabels = ["method"];
type APIMetricLabels = (typeof apiMetricLabels)[0];

export class MonitoringKubernetesRESTClient implements IKubernetesRESTClient {
    private readonly requestLatencies: Histogram<APIMetricLabels>;
    private readonly errorCount: Counter<APIMetricLabels>;

    public constructor(private readonly inner: IKubernetesRESTClient, registry: Registry) {
        this.requestLatencies = new Histogram({
            name: "kubernetes_api_request_latency_milliseconds",
            help: "Latency in milliseconds for requests to the Kubernetes API server",
            registers: [registry],
            labelNames: apiMetricLabels,
        });

        this.errorCount = new Counter({
            name: "kubernetes_api_error_count",
            help: "Amount of errors that occurred on requests to the Kubernetes API server",
            registers: [registry],
            labelNames: apiMetricLabels,
        });
    }

    private async wrap<T>(method: string, fn: () => Promise<T>): Promise<T> {
        const timer = this.requestLatencies.startTimer({ method });
        try {
            return await fn();
        } catch (err) {
            this.errorCount.inc({ method });
            throw err;
        } finally {
            timer();
        }
    }

    public post<R>(url: string, body: any): Promise<R> {
        return this.wrap("post", () => this.inner.post(url, body));
    }

    public async put<R>(url: string, body: any): Promise<R> {
        return this.wrap("put", () => this.inner.put(url, body));
    }

    public async delete<R>(
        url: string,
        opts?: DeleteOptions,
        queryParams?: { [p: string]: string },
        body?: any,
    ): Promise<R> {
        return this.wrap("delete", () => this.inner.delete(url, opts, queryParams, body));
    }

    public async get<R>(url: string, opts?: ListOptions): Promise<R | undefined> {
        return this.wrap("get", () => this.inner.get(url, opts));
    }

    public patch<R = any>(url: string, body: any, patchKind: PatchKind): Promise<R> {
        return this.wrap("patch", () => this.inner.patch(url, body, patchKind));
    }

    public watch<R extends MetadataObject>(
        url: string,
        onUpdate: (o: WatchEvent<R>) => any,
        onError: (err: any) => any,
        opts?: WatchOptions,
    ): Promise<WatchResult> {
        return this.wrap("watch", () => this.inner.watch(url, onUpdate, onError, opts));
    }
}
