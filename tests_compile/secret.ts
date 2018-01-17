import {Secret} from "../src/types/core/v1";

const secret: Secret = {
    metadata: {
        name: "foo-service",
        namespace: "martin-test",
    },
    data: {
        foo: "SGFsbG8K",
    },
};
