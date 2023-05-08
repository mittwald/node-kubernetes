import { NodeSelector, NodeSelectorTerm } from "./nodeselector";
import { LabelSelector } from "../../meta/v1";

export interface PreferredSchedulingTerm {
    preference: NodeSelectorTerm;
    weight: number;
}

export interface NodeAffinity {
    preferredDuringSchedulingIgnoredDuringExecution?: PreferredSchedulingTerm[];
    requiredDuringSchedulingIgnoredDuringExecution?: NodeSelector;
}

export interface PodAffinityTerm {
    labelSelector: LabelSelector;
    namespaces?: string[];
    topologyKey?: string;
}

export interface WeightedPodAffinityTerm {
    podAffinityTerm: PodAffinityTerm;
    weight: number;
}

export interface PodAffinity {
    preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[];
    requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
}

export interface PodAntiAffinity {
    preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[];
    requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[];
}

export type Affinity =
    | { nodeAffinity: NodeAffinity }
    | { podAffinity: PodAffinity }
    | { podAntiAffinity: PodAntiAffinity };
