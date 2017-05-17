import {ObjectMeta} from "./meta";

export interface IngressBackend {
    serviceName: string;
    servicePort: string|number;
}

export interface HTTPIngressPath {
    backend: IngressBackend;
    path?: string;
}

export interface HTTPIngressRuleValue {
    paths: HTTPIngressPath[];
}

export interface IngressRule {
    host?: string;
    http: HTTPIngressRuleValue;
}

export interface IngressTLS {
    hosts?: string[];
    secretName?: string;
}

export interface IngressSpec {
    backend?: IngressBackend;
    rules?: IngressRule[];
    tls?: IngressTLS[];
}

export interface Ingress {
    metadata: ObjectMeta;
    spec: IngressSpec;
}
