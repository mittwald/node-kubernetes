export function redactResponseBodyForLogging(body: any): any {
    if (typeof body !== "object") {
        return body;
    }

    if ("kind" in body && body.kind === "Secret") {
        const out = structuredClone(body);

        for (const key of Object.keys(out.data)) {
            out.data[key] = "[REDACTED]";
        }

        return out;
    }

    return body;
}
