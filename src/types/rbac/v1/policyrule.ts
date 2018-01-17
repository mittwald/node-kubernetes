export interface PolicyRule {
    apiGroups?: string|string[];
    nonResourceURLs?: string[];
    resourceNames?: string[];
    recources?: "ResourceAll"|string[];
    verbs?: "VerbAll"|string[];
}