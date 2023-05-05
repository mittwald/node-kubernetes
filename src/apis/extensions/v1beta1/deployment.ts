import { NamespacedResourceClient } from "../../../resource";
import { Deployment } from "../../../types/apps/v1beta1";
import { IKubernetesRESTClient, MandatorySelectorOptions } from "../../../client";
import { DeleteOptions } from "../../../types/meta/v1";
import { Registry } from "prom-client";
import * as _ from "lodash";

export class DeploymentResourceClient extends NamespacedResourceClient<Deployment, "Deployment", "extensions/v1beta1"> {
    public constructor(protected client: IKubernetesRESTClient, registry: Registry) {
        super(client, "/apis/extensions/v1beta1", "/deployments", registry);
    }

    public namespace(ns: string): DeploymentResourceClient {
        return super.namespace(ns) as DeploymentResourceClient;
    }

    public allNamespaces(): DeploymentResourceClient {
        return super.allNamespaces() as DeploymentResourceClient;
    }

    public async deleteMany(opts: MandatorySelectorOptions & DeleteOptions) {
        const resources = await this.list(opts);
        const subOpts = _.omit(opts, "labelSelector", "fieldSelector");

        await Promise.all(resources.map((r) => this.delete(r, subOpts)));
    }
}
