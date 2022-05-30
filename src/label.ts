import * as _ from "lodash";

export type AllowedOperator = "in"| "notin";
export interface MatchExpression {
    operator: AllowedOperator,
    values: string[]
}


export interface Selector {[l: string]: string | MatchExpression; }

export function selectorToQueryString(selector: Selector): string {
    const v: string[] = [];

    _.forEach(selector, (value, label) => {
        if (typeof value === "string") {
            v.push(label + "=" + value);
        } else {
            v.push(label + " "+value.operator+" (" + value.values.join(",") + ")");
        }
    });

    return v.join(",");
}
