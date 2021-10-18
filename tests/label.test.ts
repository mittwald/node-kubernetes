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
    test("should convert match expression to correct query parameter", () => {
        const qs = selectorToQueryString({
            scope: {
                operator: "in",
                values: ["internal", "external"]
            }
        });
        expect(qs).toEqual("scope in (internal,external)");
    });
    test("should convert match expression with multiple lables", () => {
        const qs = selectorToQueryString({
            scope: {
                operator: "in",
                values: ["internal", "external"]
            },
            foo: {
                operator: "notin",
                values: ["bar", "cafe"]
            }
        });
        expect(qs).toEqual("scope in (internal,external),foo notin (bar,cafe)");
    });
});
