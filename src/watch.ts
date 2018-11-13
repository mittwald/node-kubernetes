export interface WatchHandle {
    initialized: Promise<void>;
    done: Promise<void>;
    stop: () => void;
}
