import * as nock from "nock";
import {GenericClientConfig, IKubernetesRESTClient, KubernetesAPI, KubernetesRESTClient, CoreV1API} from "../src";
import {Pod, PodList, ServiceList} from "../src/types/core/v1";
import {Registry} from "prom-client";

describe("Kubernetes API client", () => {
    let scope: nock.Scope;
    let client: IKubernetesRESTClient;
    let api: CoreV1API;
    let registry: Registry;

    beforeEach(() => {
        registry = new Registry();
        scope = nock("https://kubernetes");
        client = new KubernetesRESTClient(new GenericClientConfig({
            "apiVersion": "v1",
            "users": [{name: "foo", user: {token: "foo-token"}}],
            "clusters": [{name: "foo", cluster: {server: "https://kubernetes"}}],
            "contexts": [{name: "foo", context: {user: "foo", cluster: "foo"}}],
            "current-context": "foo",
        }));
        api = new KubernetesAPI(client, registry).core().v1();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe("Pods API", () => {

        const podListData: PodList = {
            apiVersion: "v1",
            kind: "PodList",
            metadata: {continue: "", resourceVersion: "0"},
            items: [
                {
                    metadata: {name: "foo-pod"},
                    spec: {containers: [{name: "foo", image: "nginx"}]},
                },
                {
                    metadata: {name: "bar-pod"},
                    spec: {containers: [{name: "bar", image: "nginx"}]},
                },
            ],
        };

        test("should list pods from all namespaces", async () => {
            scope.get("/api/v1/pods").reply(200, podListData);

            const podList = await api.pods().list();
            expect(podList).toHaveLength(2);
            expect(podList).toHaveProperty("0.spec.containers.0.name", "foo");
            expect(podList).toHaveProperty("1.spec.containers.0.name", "bar");
        });

        test("should list pods from a specific namespace", async () => {
            scope.get("/api/v1/namespaces/test/pods").reply(200, podListData);

            const podList = await api.pods().namespace("test").list();
            expect(podList).toHaveLength(2);
            expect(podList).toHaveProperty("0.spec.containers.0.name", "foo");
            expect(podList).toHaveProperty("1.spec.containers.0.name", "bar");
        });

        test("should list pods by label selector", async () => {
            scope
                .get("/api/v1/namespaces/test/pods")
                .query({labelSelector: "spaces.de/test=test"})
                .reply(200, podListData);

            const podList = await api.pods().namespace("test").list({"spaces.de/test": "test"});
            expect(podList).toHaveLength(2);
        });

        test("should create new pods", async () => {
            const newPodInput: Pod = {metadata: {name: "some-pod"}, spec: {containers: [{name: "web", image: "nginx"}]}};

            scope
                .post("/api/v1/namespaces/test/pods", newPodInput)
                .reply(200, newPodInput);

            const pod = await api.pods().namespace("test").post(newPodInput);
            expect(pod).toHaveProperty("metadata.name", "some-pod");
        });

        test("should update existing pods", async () => {
            const podInput: Pod = {metadata: {name: "some-pod"}, spec: {containers: [{name: "web", image: "nginx"}]}};

            scope
                .put("/api/v1/namespaces/test/pods/some-pod", podInput)
                .reply(200, podInput);

            const pod = await api.pods().namespace("test").put(podInput);
            expect(pod).toHaveProperty("metadata.name", "some-pod");
        });

        test("namespace of existing pod overrides client namespace", async () => {
            const podInput: Pod = {
                metadata: {name: "some-pod", namespace: "override"},
                spec: {containers: [{name: "web", image: "nginx"}]},
            };

            scope
                .put("/api/v1/namespaces/override/pods/some-pod", podInput)
                .reply(200, podInput);

            const pod = await api.pods().namespace("test").put(podInput);
            expect(pod).toHaveProperty("metadata.name", "some-pod");
        });

        test("should delete existing pods by name", async () => {
            scope.delete("/api/v1/namespaces/test/pods/some-pod").reply(200, {});
            await api.pods().namespace("test").delete("some-pod");
        });

        test("should delete existing pods by object", async () => {
            const podInput: Pod = {
                metadata: {name: "some-pod", namespace: "test"},
                spec: {containers: [{name: "web", image: "nginx"}]},
            };

            scope.delete("/api/v1/namespaces/test/pods/some-pod").reply(200, {});
            await api.pods().namespace("test").delete(podInput);
        });

        test("should delete many pods by label selector", async () => {
            scope
                .delete("/api/v1/namespaces/test/pods")
                .query({labelSelector: "spaces.de/test=foo"})
                .reply(200, {});
            await api.pods().namespace("test").deleteMany({"spaces.de/test": "foo"});
        });

    });

    describe("Services API", () => {

        const serviceListData: ServiceList = {
            apiVersion: "v1",
            kind: "ServiceList",
            metadata: {continue: "", resourceVersion: "0"},
            items: [
                {
                    metadata: {name: "foo-svc"},
                    spec: {type: "ClusterIP", selector: {foo: "foo"}},
                },
                {
                    metadata: {name: "bar-svc"},
                    spec: {type: "ClusterIP", selector: {foo: "bar"}},
                },
            ],
        };

        test("should delete many services by label selector", async () => {
            scope.get("/api/v1/namespaces/test/services").query({labelSelector: "spaces.de/test=foo"}).reply(200, serviceListData);
            scope.delete("/api/v1/namespaces/test/services/foo-svc").reply(200);
            scope.delete("/api/v1/namespaces/test/services/bar-svc").reply(200);

            await api.services().namespace("test").deleteMany({"spaces.de/test": "foo"});
            expect(scope.isDone()).toBeTruthy();
        });

    });
});
