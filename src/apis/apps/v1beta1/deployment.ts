import {NamespacedResourceClient} from "../../../resource";
import {Deployment} from "../../../types/apps/v1beta1/deployment";
import {IKubernetesRESTClient} from "../../../client";
import {LabelSelector} from "../../../label";
import {DeleteOptions} from "../../../types/meta";

export class DeploymentResourceClient extends NamespacedResourceClient<Deployment, "Deployment", "apps/v1beta1"> {

    public constructor(protected client: IKubernetesRESTClient) {
        super(client, "/apis/apps/v1beta1", "/deployments");
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
