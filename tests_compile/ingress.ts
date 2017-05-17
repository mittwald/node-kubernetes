import {Ingress} from "../src/types/ingress";

const ingress: Ingress = {
    metadata: {
        name: "foo-service",
        namespace: "martin-test",
    },
    spec: {
        rules: [
            {
                host: "www.spaces.de",
                http: {
                    paths: [
                        {
                            path: "/",
                            backend: {
                                serviceName: "some-service",
                                servicePort: "http",
                            },
                        },
                    ],
                },
            },
        ],
    },
};
