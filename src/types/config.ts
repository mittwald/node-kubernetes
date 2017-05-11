export interface Cluster {
    name: string;
    cluster: {
        "certificate-authority-data"?: string;
        "certificate-authority"?: string;
        "server": string;
    };
}

export interface Context {
    name: string;
    context: {
        cluster: string;
        namespace?: string;
        user: string;
    };
}

export interface User {
    name: string;
    user: {
        "client-certificate-data"?: string;
        "client-certificate"?: string;
        "client-key-data"?: string;
        "client-key"?: string
        "password"?: string;
        "username"?: string;
        "token"?: string;
    }
}

export interface Config {
    apiVersion: "v1";
    clusters: Cluster[];
    contexts: Context[];
    users: User[];
    "current-context": string;
}