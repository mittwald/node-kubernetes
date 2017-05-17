import {Service} from "../src/types/service";

const clusterIPServiceWithDefaults: Service = {
    metadata: {
        name: "foo-service",
        namespace: "martin-test",
    },
    spec: {
        selector: {
            "mittwald.de/test": "test",
        },
    },
};

const clusterIPServiceWithExplicitConfig: Service = {
    metadata: {
        name: "foo-service",
        namespace: "martin-test",
    },
    spec: {
        type: "ClusterIP",
        clusterIP: "None",
        selector: {
            "mittwald.de/test": "test",
        },
        ports: [
            {protocol: "TCP", targetPort: 80, port: 80},
        ],
    },
};
