import {MetadataObject} from "./types/meta";
import {IKubernetesRESTClient, WatchOptions} from "./client";
import {DefaultListWatchErrorStrategy, ListWatchErrorStrategy} from "./resource_listwatch_error";
import {WatchHandle} from "./watch";
import {WatchEvent} from "./types/meta/v1";
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

class ListWatchState {
    #resourceVersion: number = 0;

    public running: boolean = false;
    public errorCount: number = 0;
    public successCount: number = 0;

    public set resourceVersion(value: number|string) {
        if (typeof value === "string") {
            value = parseInt(value, 10);
        }

        if (value > this.#resourceVersion) {
            this.#resourceVersion = value;
        }
    }

    public get resourceVersion(): number {
        return this.#resourceVersion;
    }

    public start() {
        this.running = true;
        this.successCount = 0;
        this.errorCount = 0;
    }

    public markSuccess() {
        this.successCount++;
        this.errorCount = 0;
    }
}

export class ListWatch<TObj extends MetadataObject> {
    private state = new ListWatchState();

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
            this.state.resourceVersion = event.object.metadata.resourceVersion;
        }
        await this.onWatchEvent(event);
    }

    private async resync() {
        const list = await this.client.get(this.baseURL, this.opts);

        if (list.metadata.resourceVersion) {
            this.state.resourceVersion = list.metadata.resourceVersion;
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
        this.state.start();

        this.metrics.watchOpenCount.inc({baseURL: this.baseURL});

        debug("starting list-watch on %o", this.resourceBaseURL);
        const initialized = this.resync();

        const {resyncAfterIterations = 10} = this.opts;

        const done = initialized.then(async () => {
            this.state.markSuccess();

            const onEstablished = () => this.state.markSuccess();

            debug("initial list for list-watch on %o completed", this.resourceBaseURL);

            while (this.state.running) {
                try {
                    if (this.state.successCount % resyncAfterIterations === 0) {
                        debug(`resyncing after ${resyncAfterIterations} successful WATCH iterations`);
                        await this.resync();
                    }

                    debug("resuming watch after %o successful iterations and %o errors", this.state.successCount, this.state.errorCount);
                    const watchOpts: WatchOptions = {...this.opts, resourceVersion: this.state.resourceVersion, onEstablished};

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

                    this.state.resourceVersion = result.resourceVersion;
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
        this.state.errorCount++;
        const reaction = this.errorStrategy(err, this.state.errorCount);

        this.metrics.watchResyncErrorCount.inc({baseURL: this.baseURL});

        debug("encountered error while watching: %o; determined reaction: %o", err, reaction);

        if (this.opts.onError) {
            await this.opts.onError(err);
        }

        if (this.opts.abortAfterErrorCount && this.state.errorCount > this.opts.abortAfterErrorCount) {
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