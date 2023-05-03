import {MetadataObject, ResourceList} from "./types/meta";
import {IKubernetesRESTClient, WatchOptions} from "./client";
import {DefaultListWatchErrorStrategy, ListWatchErrorStrategy} from "./resource_listwatch_error";
import {WatchHandle} from "./watch";
import {WatchEvent} from "./types/meta/v1";
import {ResourceClient} from "./resource";
import {Counter, Gauge} from "prom-client";

const debug = require("debug")("kubernetes:resource:listwatch");
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
const doNothing = () => {
};

export interface ListWatchOptions<R extends MetadataObject> extends WatchOptions {
    onResync?: (objs: R[]) => any;
    skipAddEventsOnResync?: boolean;
    errorStrategy?: ListWatchErrorStrategy;
}

export interface ListWatchMetrics {
    watchResyncErrorCount: Counter<"baseURL">;
    watchOpenCount: Gauge<"baseURL">;
}

export class ListWatch<TObj extends MetadataObject> {
    private resourceVersion: number = 0;
    private running: boolean = false;
    private errorCount: number = 0;
    private successCount: number = 0;

    private readonly baseURL: string;
    private readonly resourceBaseURL: string;
    private readonly opts: ListWatchOptions<TObj>;
    private readonly client: IKubernetesRESTClient;
    private readonly metrics: ListWatchMetrics;

    private readonly onWatchEvent: (event: WatchEvent<TObj>) => any;
    private readonly onWatchError: (error: any) => any;
    private readonly errorStrategy: ListWatchErrorStrategy;

    public constructor(
        onWatchEvent: (event: WatchEvent<TObj>) => any,
        onWatchError: ((error: any) => any) | undefined,
        client: IKubernetesRESTClient,
        baseURL: string,
        resourceBaseURL: string,
        opts: ListWatchOptions<TObj>,
        metrics: ListWatchMetrics,
    ) {
        this.onWatchEvent = onWatchEvent;
        this.onWatchError = onWatchError ?? doNothing;
        this.errorStrategy = opts.errorStrategy ?? DefaultListWatchErrorStrategy;
        this.client = client;
        this.baseURL = baseURL;
        this.resourceBaseURL = resourceBaseURL;
        this.opts = opts;
        this.metrics = metrics;
    }

    private async handler(event: WatchEvent<TObj>) {
        if (event.object.metadata.resourceVersion) {
            this.resourceVersion = Math.max(this.resourceVersion, parseInt(event.object.metadata.resourceVersion, 10));
        }
        await this.onWatchEvent(event);
    }

    private async resync() {
        const list = await this.client.get(this.baseURL, this.opts);

        if (list.metadata.resourceVersion) {
            this.resourceVersion = parseInt(list.metadata.resourceVersion, 10);
        }

        if (this.opts.onResync) {
            await this.opts.onResync(list.items || []);
        }

        if (!this.opts.skipAddEventsOnResync) {
            for (const i of list.items || []) {
                const event: WatchEvent<TObj> = {type: "ADDED", object: i};
                await this.onWatchEvent(event);
            }
        }
    }

    public run(): WatchHandle {
        this.running = true;
        this.resourceVersion = 0;

        this.metrics.watchOpenCount.inc({baseURL: this.baseURL});

        debug("starting list-watch on %o", this.resourceBaseURL);
        const initialized = this.resync();

        const {resyncAfterIterations = 10} = this.opts;

        const done = initialized.then(async () => {
            this.errorCount = 0;
            this.successCount = 1;

            const onEstablished = () => {
                this.errorCount = 0;
                this.successCount++;
            };

            debug("initial list for list-watch on %o completed", this.resourceBaseURL);

            while (this.running) {
                try {
                    if (this.successCount % resyncAfterIterations === 0) {
                        debug(`resyncing after ${resyncAfterIterations} successful WATCH iterations`);
                        await this.resync();
                    }

                    debug("resuming watch after %o successful iterations and %o errors", this.successCount, this.errorCount);
                    const watchOpts: WatchOptions = {...this.opts, resourceVersion: this.resourceVersion, onEstablished};

                    const result = await this.client.watch<TObj>(
                        this.baseURL,
                        e => this.handler(e),
                        e => this.onWatchError(e),
                        watchOpts,
                    );

                    if (result.resyncRequired) {
                        debug(`resyncing listwatch`);
                        await this.resync();

                        continue;
                    }

                    this.resourceVersion = Math.max(this.resourceVersion, result.resourceVersion);
                } catch (err) {
                    await this.handleWatchIterationError(err);
                }
            }

            this.metrics.watchOpenCount.dec({baseURL: this.baseURL});
        });

        return {
            initialized,
            done,
            stop() {
                this.running = false;
            },
        };
    }

    private async handleWatchIterationError(err: unknown) {
        this.errorCount++;
        const reaction = this.errorStrategy(err, this.errorCount);

        this.metrics.watchResyncErrorCount.inc({baseURL: this.baseURL});

        debug("encountered error while watching: %o; determined reaction: %o", err, reaction);

        if (this.opts.onError) {
            await this.opts.onError(err);
        }

        if (this.opts.abortAfterErrorCount && this.errorCount > this.opts.abortAfterErrorCount) {
            this.metrics.watchOpenCount.dec({baseURL: this.baseURL});
            throw new Error(`more than ${this.opts.abortAfterErrorCount} consecutive errors when watching ${this.baseURL}`);
        }

        if (reaction.backoff) {
            debug("resuming watch after back-off of %o ms", reaction.backoff);
            await sleep(reaction.backoff);
        }

        if (reaction.resync) {
            debug("resuming watch with resync after error: %o", err);
            await this.resync();
        }
    }
}