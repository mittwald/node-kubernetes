export interface ListWatchErrorReaction {
    resync: boolean;
    backoff: number;
}

export type ListWatchErrorStrategy = (err: any, errCount: number) => ListWatchErrorReaction;

export const DefaultListWatchErrorStrategy: ListWatchErrorStrategy = (err: any, errCount: number): ListWatchErrorReaction => {
    if (err.code === "ECONNRESET") {
        return {
            resync: false,
            backoff: 100 * (Math.min(errCount, 10) - 1),
        };
    }

    return {
        resync: true,
        backoff: 10_000,
    };
};