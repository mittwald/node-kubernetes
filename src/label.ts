import * as _ from "lodash";

export interface Selector {[l: string]: string; }

export function selectorToQueryString(selector: Selector): string {
    const v: string[] = [];

    _.forEach(selector, (value, label) => {
        v.push(label + "=" + value);
    });

    return v.join(",");
}
