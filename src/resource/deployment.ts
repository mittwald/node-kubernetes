import {NamespacedResourceClient} from "../resource";
import {Deployment} from "../types/deployment";
import {IKubernetesRESTClient} from "../client";
import {LabelSelector} from "../label";
import {DeleteOptions} from "../types/meta";

export class DeploymentResourceClient extends NamespacedResourceClient<Deployment, "Deployment", "extensions/v1beta1"> {

    public constructor(protected client: IKubernetesRESTClient) {
        super(client, "/apis/extensions/v1beta1", "/deployments");
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
