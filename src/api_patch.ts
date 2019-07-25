
export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends Array<infer U> ? Array<RecursivePartial<U>> :
        T[P] extends object ? RecursivePartial<T[P]> :
            T[P];
};

export type JSONPatchElement =
    | {op: "replace", path: string; value: any}
    | {op: "add", path: string, value: any}
    | {op: "remove", path: string}
    | {op: "copy", path: string, from: string}
    | {op: "move", path: string, from: string}
    | {op: "test", path: string, value: any}
    ;

export type JSONPatch = JSONPatchElement[];
