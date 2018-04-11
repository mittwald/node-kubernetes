export interface WatchHandle {
    initialized: Promise<void>;
    stop: () => void;
}
