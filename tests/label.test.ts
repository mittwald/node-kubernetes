import { parseLabelSelector, Selector, selectorToQueryString, selectorToString } from "../src/label";

describe("Label selector to query string", () => {
    test("should convert to correct query parameter", () => {
        const qs = selectorToQueryString({ foo: "bar" });
        expect(qs).toEqual("foo=bar");
    });
    test("should convert to correct query parameter with multiple labels", () => {
        const qs = selectorToQueryString({ foo: "bar", bar: "baz" });
        expect(qs).toEqual("foo=bar,bar=baz");
    });
    test("should convert match expression to correct query parameter", () => {
        const qs = selectorToQueryString({
            scope: {
                operator: "in",
                values: ["internal", "external"],
            },
        });
        expect(qs).toEqual("scope in (internal,external)");
    });
    test("should convert match expression with multiple lables", () => {
        const qs = selectorToQueryString({
            scope: {
                operator: "in",
                values: ["internal", "external"],
            },
            foo: {
                operator: "notin",
                values: ["bar", "cafe"],
            },
        });
        expect(qs).toEqual("scope in (internal,external),foo notin (bar,cafe)");
    });
});

describe("String to label selector", () => {
    test.each<[string, { input: string, expected: Selector }]>([
        ["for =", {input: "foo=bar", expected: {foo: "bar"}}],
        ["for !=", {input: "foo!=bar", expected: {foo: {operator: "!=", values: ["bar"]}}}],
        ["for ==", {input: "foo!=bar", expected: {foo: {operator: "!=", values: ["bar"]}}}],
    ])("should parse to correct selector %s", (_, {input, expected}) => {
        const selector = parseLabelSelector(input);
        expect(selector).toEqual(expected);
    });
    test("should parse to correct selector with multiple items", () => {
        const selector = parseLabelSelector("foo=bar;bar=baz");
        expect(selector).toEqual({foo: "bar", bar: "baz"});
    });
    test("trims values if spaces are used", () => {
        const selector = parseLabelSelector("foo = bar;bar = baz");
        expect(selector).toEqual({foo: "bar", bar: "baz"});
    });
    test("should parse to correct selector with different operators in items", () => {
        const selector = parseLabelSelector("foo=bar;bar!=baz");
        expect(selector).toEqual({foo: "bar", bar: {operator: "!=", values: ["baz"]}});
    });
    test("should parse match expression to correct selector", () => {
        const selector = parseLabelSelector("scope in (internal,external)");
        expect(selector).toEqual({
            scope: {
                operator: "in",
                values: ["internal", "external"]
            }
        });
    });
    test("can handle odd whitespaces around match expression operator", () => {
        const selector = parseLabelSelector("scope  in   (internal,external)");
        expect(selector).toEqual({
            scope: {
                operator: "in",
                values: ["internal", "external"]
            }
        });
    });
    test("trims whitespaces around values in match expression", () => {
        const selector = parseLabelSelector("scope in ( internal , external )");
        expect(selector).toEqual({
            scope: {
                operator: "in",
                values: ["internal", "external"]
            }
        });
    });
    describe("evaluates only first operator if wrong separator is used", () => {
        test(" for match expressions", () => {
            const selector = parseLabelSelector("scope in (internal,external),bar notin (foo,cafe)");
            expect(selector).toEqual({
                "scope": {
                    "operator": "in",
                    "values": [
                        "internal",
                        "external)",
                        "bar notin (foo",
                        "cafe"
                    ]
                }
            });
        });
        test("evaluates first operator if wrong separator is used for equality expressions", () => {
            const selector = parseLabelSelector("foo=bar,bar!=baz");
            expect(selector).toEqual({
                "foo": "bar,bar!=baz"
            });
        });
    });
});

test("string to label and label to string are compatible", () => {
    const input = "scope in (internal,external);bar notin (foo,cafe)";
    const selector = parseLabelSelector(input);
    const output = selectorToString(selector);
    expect(output).toEqual(input);
})
