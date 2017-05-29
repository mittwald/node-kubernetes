import {NamespacedResourceClient} from "../resource";
import {Deployment} from "../types/deployment";
import {KubernetesRESTClient} from "../client";
import {LabelSelector} from "../label";

export interface IStatefulSetDeletionOptions {
    orphanDependents: boolean;
}

const defaultStatefulSetDeletionOptions: IStatefulSetDeletionOptions = {
    orphanDependents: false,
};

export class StatefulSetResourceClient extends NamespacedResourceClient<Deployment, "StatefulSet", "apps/v1beta1"> {

    public constructor(protected client: KubernetesRESTClient) {
        super(client, "/apis/apps/v1beta1", "/statefulsets");
    }

    public namespace(ns: string): StatefulSetResourceClient {
        return super.namespace(ns) as StatefulSetResourceClient;
    }

    public allNamespaces(): StatefulSetResourceClient {
        return super.allNamespaces() as StatefulSetResourceClient;
    }

    public async delete(resourceOrName: string|Deployment,
                        opts: Partial<IStatefulSetDeletionOptions> = {}): Promise<void> {
        let url;

        opts = {...defaultStatefulSetDeletionOptions, ...opts};

        if (typeof resourceOrName === "string") {
            url = this.baseURL + "/" + resourceOrName;
        } else {
            url = this.urlForResource(resourceOrName);
        }

        return await this.client.delete(url, undefined, {orphanDependents: opts.orphanDependents ? "true" : "false"});
    }

    public async deleteMany(labelSelector: LabelSelector,
                            opts: Partial<IStatefulSetDeletionOptions> = {}) {
        const resources = await this.list(labelSelector);
        await Promise.all(resources.map(r => this.delete(r, opts)));
    }
}
