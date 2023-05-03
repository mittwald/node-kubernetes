import * as fs from "fs";
import * as yaml from "yamljs";
import {Config} from "./types/config";
import {AxiosRequestConfig, RawAxiosRequestHeaders} from "axios";
import * as https from "https";
import {AgentOptions} from "https";
import {SecureClientSessionOptions} from "http2";
import * as http2 from "http2";

export interface IKubernetesClientConfig {

    apiServerURL: string;
    namespace: string;

    mapAxiosOptions<T extends AxiosRequestConfig = AxiosRequestConfig>(opts: T): T;
    mapNativeOptions<T extends SecureClientSessionOptions = SecureClientSessionOptions>(opts: T): T;
    mapHeaders(headers: Record<string, string>): Record<string, string>;

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

    private getHTTPSAgentOptions(): AgentOptions {
        const context = this.kubeconfig.contexts.find(c => c.name === this.kubeconfig["current-context"])!;
        const cluster = this.kubeconfig.clusters.find(c => c.name === context.context.cluster)!;
        const user = this.kubeconfig.users.find(c => c.name === context.context.user)!;

        const httpsOpts: AgentOptions = {};

        const ca = cluster.cluster["certificate-authority-data"];
        if (ca) {
            httpsOpts.ca = Buffer.from(ca, "base64");
        }

        const caFile = cluster.cluster["certificate-authority"];
        if (caFile) {
            httpsOpts.ca = fs.readFileSync(caFile);
        }

        const clientCert = user.user["client-certificate-data"];
        if (clientCert) {
            httpsOpts.cert = Buffer.from(clientCert, "base64");
        }

        const clientCertFile = user.user["client-certificate"];
        if (clientCertFile) {
            httpsOpts.cert = fs.readFileSync(clientCertFile);
        }

        const clientKey = user.user["client-key-data"];
        if (clientKey) {
            httpsOpts.key = Buffer.from(clientKey, "base64");
        }

        const clientKeyFile = user.user["client-key"];
        if (clientKeyFile) {
            httpsOpts.key = fs.readFileSync(clientKeyFile);
        }

        return httpsOpts;
    }

    public mapNativeOptions<T extends SecureClientSessionOptions = SecureClientSessionOptions>(opts: T): T {
        const agentOpts = this.getHTTPSAgentOptions();

        return {
            ...structuredClone(opts),
            ca: agentOpts.ca,
            cert: agentOpts.cert,
            key: agentOpts.key,
        };
    }

    public mapHeaders(headers: Record<string, string>): Record<string, string> {
        const context = this.kubeconfig.contexts.find(c => c.name === this.kubeconfig["current-context"])!;
        const user = this.kubeconfig.users.find(c => c.name === context.context.user)!;

        const out = {...headers};

        if (user.user.token) {
            out[http2.constants.HTTP2_HEADER_AUTHORIZATION] = "Bearer " + user.user.token;
        }

        if (user.user.username && user.user.password) {
            out[http2.constants.HTTP2_HEADER_AUTHORIZATION] = "Basic " + Buffer.from(user.user.username + ":" + user.user.password).toString("base64");
        }

        return out;
    }

    public mapAxiosOptions<T extends AxiosRequestConfig = AxiosRequestConfig>(opts: T): T {
        const context = this.kubeconfig.contexts.find(c => c.name === this.kubeconfig["current-context"])!;
        const user = this.kubeconfig.users.find(c => c.name === context.context.user)!;

        if (!opts.headers) {
            opts.headers = {};
        }

        if (user.user.token) {
            opts.headers.Authorization = "Bearer " + user.user.token;
        }

        if (user.user.username && user.user.password) {
            opts.auth = {username: user.user.username, password: user.user.password};
        }

        const headers = this.mapHeaders({});
        for (const key of Object.keys(headers)) {
            opts.headers[key] = headers[key];
        }

        opts.httpsAgent = new https.Agent(this.getHTTPSAgentOptions());

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
