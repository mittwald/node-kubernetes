export interface NodeSelectorRequirement {
    key: string;
    operator: string;
    values: string[];
}

export interface NodeSelectorTerm {
    matchExpressions: NodeSelectorRequirement[];
}

export interface NodeSelector {
    nodeSelectorTerms: NodeSelectorTerm[];
}
