import * as request from "request";
import * as fs from "fs";
import * as yaml from "yamljs";
import {Config} from "./types/config";

export interface IKubernetesClientConfig {

    apiServerURL: string;
    namespace: string;

    mapRequestOptions<T extends request.Options = request.Options>(opts: T): T;

}

export class GenericClientConfig implements IKubernetesClientConfig {

    public apiServerURL: string;
    public namespace: string;

    public constructor(private kubeconfig: Config) {
        const context = this.kubeconfig.contexts.find(c => c.name === this.kubeconfig["current-context"])!;
        const cluster = this.kubeconfig.clusters.find(c => c.name === context.context.cluster)!;
        const user = this.kubeconfig.users.find(c => c.name === context.context.user)!;

        this.apiServerURL = cluster.cluster.server.replace(/\/$/, "");
        this.namespace = context.context.namespace || "default";
    }

    public mapRequestOptions<T extends request.Options = request.Options>(opts: T): T {
        const context = this.kubeconfig.contexts.find(c => c.name === this.kubeconfig["current-context"])!;
        const cluster = this.kubeconfig.clusters.find(c => c.name === context.context.cluster)!;
        const user = this.kubeconfig.users.find(c => c.name === context.context.user)!;

        const ca = cluster.cluster["certificate-authority-data"];
        if (ca) {
            opts.ca = Buffer.from(ca, "base64");
        }

        const caFile = cluster.cluster["certificate-authority"];
        if (caFile) {
            opts.ca = fs.readFileSync(caFile);
        }

        if (!opts.headers) {
            opts.headers = {};
        }

        if (user.user.token) {
            opts.headers.Authorization = "Bearer " + user.user.token;
        }

        const clientCert = user.user["client-certificate-data"];
        if (clientCert) {
            opts.cert = Buffer.from(clientCert, "base64");
        }

        const clientCertFile = user.user["client-certificate"];
        if (clientCertFile) {
            opts.cert = fs.readFileSync(clientCertFile);
        }

        const clientKey = user.user["client-key-data"];
        if (clientKey) {
            opts.key = Buffer.from(clientKey, "base64");
        }

        const clientKeyFile = user.user["client-key"];
        if (clientKeyFile) {
            opts.key = fs.readFileSync(clientKeyFile);
        }

        if (user.user.username && user.user.password) {
            opts.auth = {username: user.user.username, password: user.user.password};
        }

        return opts;
    }
}

export class FileBasedConfig extends GenericClientConfig {
    public constructor(kubeconfigFile: string) {
        // const contents = fs.readFileSync(kubeconfigFile, "utf-8");
        const kubeconfig = yaml.load(kubeconfigFile);

        super(kubeconfig);
    }
}

export class InClusterConfig extends GenericClientConfig {
    public constructor(namespace?: string) {
        const kubeconfig: Config = {
            "apiVersion": "v1",
            "clusters": [{
                name: "local",
                cluster: {
                    "certificate-authority": "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt",
                    "server": "https://kubernetes.default",
                },
            }],
            "users": [{
                name: "serviceaccount",
                user: {
                    token: fs.readFileSync("/var/run/secrets/kubernetes.io/serviceaccount/token", "utf-8"),
                },
            }],
            "contexts": [{
                name: "local",
                context: {cluster: "local", user: "serviceaccount", namespace: namespace || "default"},
            }],
            "current-context": "local",
        };

        super(kubeconfig);
    }

}
