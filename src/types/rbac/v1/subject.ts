export interface NamespacedSubject {
    apiGroup?: string;
    kind: "ServiceAccount";
    name: string;
    namespace: string;
}

export interface NonNamespacedSubject {
    apiGroup?: string;
    kind: "User" | "Group";
    name: string;
}

export type Subject = NamespacedSubject | NonNamespacedSubject;
