import {FileBasedConfig} from "./config";
import {KubernetesRESTClient} from "./client";
import {KubernetesAPI} from "./api";

const config = new FileBasedConfig("/home/mhelmich/.kube/config");
const client = new KubernetesRESTClient(config);
const api = new KubernetesAPI(client);

(async () => {
    // const pods = await api.pods().namespace("kube-system").list();
    // pods.forEach(pod => console.log(pod.metadata.name));
    //
    // await api.persistentVolumes().apply({
    //     metadata: {
    //         name: "test"
    //     },
    //     spec: {
    //         accessModes: ["ReadWriteOnce"],
    //         capacity: {storage: "5Gi"},
    //         hostPath: {
    //             path: "/foo"
    //         }
    //     }
    // });
    //
    // const deployments = await api.deployments().namespace("hyperspace").list();
    // console.log(deployments);

})().catch(console.error);
