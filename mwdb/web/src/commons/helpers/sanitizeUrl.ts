export function sanitizeUrl(url: string): string | null {
    // Normalize exactly as the browser does when parsing an href, so that
    // what we check matches what the browser interprets on click. Otherwise
    // obfuscations like "java\nscript:" or "\x01javascript:" could hide the
    // scheme from the allowlist below while the browser strips those chars
    // and re-exposes the dangerous scheme.
    // (WHATWG URL Standard: remove all tab/newline, then strip leading and
    // trailing C0 control or space characters.)
    const normalized = url
        .replace(/[\t\n\r]/g, "")
        .replace(/^[\u0000-\u001F\u0020]+|[\u0000-\u001F\u0020]+$/g, "");
    // Match URLs starting with scheme
    const schemeMatch = normalized.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    if (schemeMatch) {
        const allowed_schemes = new Set(["http", "https"]);
        const scheme = schemeMatch[1].toLowerCase();
        // Allow only http: and https:
        if (allowed_schemes.has(scheme)) {
            return normalized;
        }
        return null; // Disallowed scheme
    }

    // No scheme: relative URI, anchor, or protocol-relative URL.
    return normalized;
}
