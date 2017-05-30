import {NamespacedResourceClient} from "../resource";
import {Deployment} from "../types/deployment";
import {IKubernetesRESTClient} from "../client";
import {LabelSelector} from "../label";

export interface IDeploymentDeletionOptions {
    orphanDependents: boolean;
}

const defaultDeploymentDeletionOptions: IDeploymentDeletionOptions = {
    orphanDependents: false,
};

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

    public async delete(resourceOrName: string|Deployment,
                        opts: Partial<IDeploymentDeletionOptions> = {}): Promise<void> {
        let url;

        opts = {...defaultDeploymentDeletionOptions, ...opts};

        if (typeof resourceOrName === "string") {
            url = this.baseURL + "/" + resourceOrName;
        } else {
            url = this.urlForResource(resourceOrName);
        }

        return await this.client.delete(url, undefined, {orphanDependents: opts.orphanDependents ? "true" : "false"});
    }

    public async deleteMany(labelSelector: LabelSelector,
                            opts: Partial<IDeploymentDeletionOptions> = {}) {
        const resources = await this.list(labelSelector);
        await Promise.all(resources.map(r => this.delete(r, opts)));
    }
}
