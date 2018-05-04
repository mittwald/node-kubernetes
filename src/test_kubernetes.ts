import {FileBasedConfig} from "./config";
import {KubernetesRESTClient} from "./client";
import {KubernetesAPI} from "./api";
import {register} from "prom-client";

const config = new FileBasedConfig("/home/mhelmich/.kube/config");
const client = new KubernetesRESTClient(config);
const api = new KubernetesAPI(client, register);

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
    //
    // api.pods().watch({}, ev => {
    //     console.log("POD");
    //     console.log(ev.object);
    // });

})().catch(console.error);
