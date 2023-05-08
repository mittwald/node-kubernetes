export type SetBasedOperator = "in" | "notin";
export type EqualityBasedOperator = "=" | "==" | "!=";
export type AllowedOperator = EqualityBasedOperator | SetBasedOperator;

export interface MatchExpression {
    operator: AllowedOperator;
    values: string[];
}

export interface Selector {
    [l: string]: string | MatchExpression;
}

export function selectorToString(selector: Selector, separator = ";"): string {
    const parts = Object.entries(selector).map(([label, value]) => {
        if (typeof value === "string") {
            return label + "=" + value;
        }
        return label + " " + value.operator + " (" + value.values.join(",") + ")";
    });

    return parts.join(separator);
}

export const selectorToQueryString = (selector: Selector) => selectorToString(selector, ",");

const setBasedSelectorRegex = new RegExp("([^() ]*) +(in|notin) +\\((.*)\\)", "i");

/**
 * Parse a Label Selector string to a Selector Object.
 * Label Selectors are described in the [Kubernetes documentation](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors).
 *
 * Uses `;` as a separator for multiple expressions in the string.
 */
export function parseLabelSelector(input: string): Selector {
    const selector: Selector = {};

    for (const item of input.split(";")) {
        const regexResult = setBasedSelectorRegex.exec(item);
        if (regexResult !== null) {
            selector[regexResult[1]] = {
                operator: regexResult[2] as SetBasedOperator,
                values: regexResult[3].split(",").map((v) => v.trim()),
            };
        } else {
            const [key, operator, ...values] = item.split(/(=|!=|==)/);
            const trimmedValues = values.map((v) => v.trim());
            selector[key.trim()] =
                operator === "="
                    ? trimmedValues.join("")
                    : { operator: operator as EqualityBasedOperator, values: trimmedValues };
        }
    }

    return selector;
}
