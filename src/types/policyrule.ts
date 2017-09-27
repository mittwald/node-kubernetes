export interface PolicyRule {
    verbs: string[];
    apiGroups: string[];
    resources?: string[];
    resourceNames?: string[];
    nonResourceURLs?: string[];
}
