import {selectorToQueryString} from "../src/label";

describe("Label selector", () => {
    test("should convert to correct query parameter", () => {
        const qs = selectorToQueryString({foo: "bar"});
        expect(qs).toEqual("foo=bar");
    });
    test("should convert to correct query parameter with multiple labels", () => {
        const qs = selectorToQueryString({foo: "bar", bar: "baz"});
        expect(qs).toEqual("foo=bar,bar=baz");
    });
});
