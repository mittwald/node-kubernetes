import {NamespacedResourceClient} from "../../../resource";
import {IKubernetesRESTClient} from "../../../client";
import {LabelSelector} from "../../../label";
import {StatefulSet} from "../../../types/apps/v1beta1";
import {DeleteOptions} from "../../../types/meta/v1";
import {Registry} from "prom-client";

export class StatefulSetResourceClient extends NamespacedResourceClient<StatefulSet, "StatefulSet", "apps/v1beta1"> {

    public constructor(protected client: IKubernetesRESTClient, registry: Registry) {
        super(client, "/apis/apps/v1beta1", "/statefulsets", registry);
    }

    public namespace(ns: string): StatefulSetResourceClient {
        return super.namespace(ns) as StatefulSetResourceClient;
    }

    public allNamespaces(): StatefulSetResourceClient {
        return super.allNamespaces() as StatefulSetResourceClient;
    }

    public async deleteMany(labelSelector: LabelSelector,
                            opts: DeleteOptions = {}) {
        const resources = await this.list(labelSelector);
        await Promise.all(resources.map(r => this.delete(r, opts)));
    }
}
