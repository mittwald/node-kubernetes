import {GenericClientConfig, KubernetesRESTClient} from "../src";
import * as nock from "nock";

describe(KubernetesRESTClient.name, () => {
    let scope: nock.Scope;
    let client: KubernetesRESTClient;

    beforeEach(() => {
        scope = nock("https://kubernetes");

        client = new KubernetesRESTClient(new GenericClientConfig({
            "apiVersion": "v1",
            "users": [{name: "foo", user: {token: "foo-token"}}],
            "clusters": [{name: "foo", cluster: {server: "https://kubernetes"}}],
            "contexts": [{name: "foo", context: {user: "foo", cluster: "foo"}}],
            "current-context": "foo",
        }));
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe("GET", () => {
        test("can load resources from server", async () => {
            scope.get("/api/v1/foo/1").reply(200, {kind: "Test", data: {foo: "bar"}});

            const response = await client.get("/api/v1/foo/1");
            expect(response).toHaveProperty("kind", "Test");
        });

        test("can load resources from server with label selectors", async () => {
            scope.get("/api/v1/foo/1").query({labelSelector: "spaces.de/test=foo"}).reply(200, {kind: "Test"});

            const response = await client.get("/api/v1/foo/1", {"spaces.de/test": "foo"});
            expect(response).toHaveProperty("kind", "Test");
        });

        test("returns undefined when server responds 404", async () => {
            scope.get("/api/v1/foo/2").reply(404, {kind: "Status", status: "Failure", reason: "NotFound"});
            const response = await client.get("/api/v1/foo/2");
            expect(response).toBeUndefined();
        });

        test("throws error when server responds failure other than 404", async () => {
            scope.get("/api/v1/foo/2").reply(500, {
                kind: "Status",
                status: "Failure",
                reason: "InternalError",
                message: "Go fuck yourself",
            });
            const response = client.get("/api/v1/foo/2");
            await expect(response).rejects.toHaveProperty("message", "Go fuck yourself");
        });
    });

    describe("POST", () => {
        test("can post resources to server and return response", async () => {
            scope.post("/api/v1/foo", `{"kind":"Test"}`).reply(201, {kind: "Test", bar: "baz"});

            const response = await client.post("/api/v1/foo", {kind: "Test"});
            expect(response).toHaveProperty("kind", "Test");
            expect(response).toHaveProperty("bar", "baz");
        });

        test("can post resources to server without body", async () => {
            scope.post("/api/v1/foo").reply(201, {kind: "Test", bar: "baz"});

            const response = await client.post("/api/v1/foo", undefined);
            expect(response).toHaveProperty("kind", "Test");
            expect(response).toHaveProperty("bar", "baz");
        });

        test("throws error when server responds failure other than 404", async () => {
            scope.post("/api/v1/foo").reply(500, {
                kind: "Status",
                status: "Failure",
                reason: "InternalError",
                message: "Go fuck yourself",
            });
            const response = client.post("/api/v1/foo", {kind: "Test"});
            await expect(response).rejects.toHaveProperty("message", "Go fuck yourself");
        });
    });

    describe("PUT", () => {
        test("can put resources to server and return response", async () => {
            scope.put("/api/v1/foo/1", `{"kind":"Test"}`).reply(200, {kind: "Test", bar: "baz"});

            const response = await client.put("/api/v1/foo/1", {kind: "Test"});
            expect(response).toHaveProperty("kind", "Test");
            expect(response).toHaveProperty("bar", "baz");
        });

        test("throws error when server responds failure other than 404", async () => {
            scope.put("/api/v1/foo/1").reply(500, {
                kind: "Status",
                status: "Failure",
                reason: "InternalError",
                message: "Go fuck yourself",
            });
            const response = client.put("/api/v1/foo/1", {kind: "Test"});
            await expect(response).rejects.toHaveProperty("message", "Go fuck yourself");
        });
    });

    describe("DELETE", () => {
        test("can delete resources from server and return response", async () => {
            scope.delete("/api/v1/foo/1").reply(200, {kind: "Test", bar: "baz"});

            const response = await client.delete("/api/v1/foo/1");
            expect(response).toHaveProperty("kind", "Test");
            expect(response).toHaveProperty("bar", "baz");
        });

        test("can delete resources with label selector", async () => {
            scope
                .delete("/api/v1/foo/1")
                .query({labelSelector: "spaces.de/foo=bar"})
                .reply(200, {kind: "Test", bar: "baz"});

            const response = await client.delete("/api/v1/foo/1", {"spaces.de/foo": "bar"});
            expect(response).toHaveProperty("kind", "Test");
            expect(response).toHaveProperty("bar", "baz");
        });

        test("throws error when server responds failure other than 404", async () => {
            scope.delete("/api/v1/foo/1").reply(500, {
                kind: "Status",
                status: "Failure",
                reason: "InternalError",
                message: "Go fuck yourself",
            });
            const response = client.delete("/api/v1/foo/1");
            await expect(response).rejects.toHaveProperty("message", "Go fuck yourself");
        });
    });
});
