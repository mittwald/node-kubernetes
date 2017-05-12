import {labelSelectorToQueryString} from "../src/label";

describe("Label selector", () => {
    test("should convert to correct query parameter", () => {
        const qs = labelSelectorToQueryString({foo: "bar"});
        expect(qs).toEqual("foo=bar");
    });
    test("should convert to correct query parameter with multiple labels", () => {
        const qs = labelSelectorToQueryString({foo: "bar", bar: "baz"});
        expect(qs).toEqual("foo=bar,bar=baz");
    });
});