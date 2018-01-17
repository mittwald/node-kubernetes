import {StatefulSet} from "../src/types/apps/v1beta1";

const statefulsetWithoutVolume: StatefulSet = {
    metadata: {
        name: "test",
        namespace: "martin-test",
    },
    spec: {
        replicas: 2,
        serviceName: "test",
        template: {
            metadata: {
                labels: {
                    "mittwald.de/app": "foo-app",
                },
            },
            spec: {
                containers: [{
                    name: "web",
                    image: "nginx",
                }],
            },
        },
    },
};

const statefulsetWithVolume: StatefulSet = {
    metadata: {
        name: "test",
        namespace: "martin-test",
    },
    spec: {
        replicas: 2,
        serviceName: "test",
        template: {
            metadata: {
                labels: {
                    "mittwald.de/app": "foo-app",
                },
            },
            spec: {
                containers: [{
                    name: "web",
                    image: "nginx",
                }],
            },
        },
        volumeClaimTemplates: [
            {
                metadata: {
                    labels: {"mittwald.de/app": "foo-app"},
                },
                spec: {
                    accessModes: ["ReadWriteOnce"],
                    storageClassName: "fast",
                    resources: {
                        requests: {storage: "5Gi"},
                    },
                },
            },
        ],
    },
};

const statefulsetWithUpdateStrategy: StatefulSet = {
    metadata: {
        name: "test",
        namespace: "martin-test",
    },
    spec: {
        replicas: 2,
        serviceName: "test",
        updateStrategy: {
            type: "RollingUpdate",
        },
        template: {
            metadata: {
                labels: {
                    "mittwald.de/app": "foo-app",
                },
            },
            spec: {
                containers: [{
                    name: "web",
                    image: "nginx",
                }],
            },
        },
        volumeClaimTemplates: [
            {
                metadata: {
                    labels: {"mittwald.de/app": "foo-app"},
                },
                spec: {
                    accessModes: ["ReadWriteOnce"],
                    storageClassName: "fast",
                    resources: {
                        requests: {storage: "5Gi"},
                    },
                },
            },
        ],
    },
};
