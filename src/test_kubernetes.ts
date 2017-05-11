import {FileBasedConfig} from "./config";
import {KubernetesAPI, KubernetesRESTClient} from "./client";

const config = new FileBasedConfig("/home/mhelmich/.kube/config");
const client = new KubernetesRESTClient(config);
const api = new KubernetesAPI(client);

(async () => {
    //const pods = await api.pods().namespace("kube-system").list();
    //pods.forEach(pod => console.log(pod.metadata.name));

    await api.persistentVolumes().apply({
        metadata: {
            name: "test"
        },
        spec: {
            accessModes: ["ReadWriteOnce"],
            capacity: {storage: "5Gi"},
            hostPath: {
                path: "/foo"
            }
        }
    });

})().catch(console.error);