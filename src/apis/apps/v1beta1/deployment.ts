import {NamespacedResourceClient} from "../../../resource";
import {Deployment} from "../../../types/apps/v1beta1";
import {IKubernetesRESTClient} from "../../../client";
import {LabelSelector} from "../../../label";
import {DeleteOptions} from "../../../types/meta/v1";
import {Registry} from "prom-client";

export class DeploymentResourceClient extends NamespacedResourceClient<Deployment, "Deployment", "apps/v1beta1"> {

    public constructor(protected client: IKubernetesRESTClient, registry: Registry) {
        super(client, "/apis/apps/v1beta1", "/deployments", registry);
    }

    public namespace(ns: string): DeploymentResourceClient {
        return super.namespace(ns) as DeploymentResourceClient;
    }

    public allNamespaces(): DeploymentResourceClient {
        return super.allNamespaces() as DeploymentResourceClient;
    }

    public async deleteMany(labelSelector: LabelSelector,
                            opts: DeleteOptions = {}) {
        const resources = await this.list(labelSelector);
        await Promise.all(resources.map(r => this.delete(r, opts)));
    }
}
