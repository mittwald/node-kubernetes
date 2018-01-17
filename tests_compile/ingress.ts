import {Ingress} from "../src/types/extensions/v1beta1";

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
