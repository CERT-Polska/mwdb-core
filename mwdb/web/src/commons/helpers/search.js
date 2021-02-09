export function encodeSearchQuery(query) {
    // We need to escape this twice because of this bug: https://github.com/ReactTraining/history/issues/505
    return encodeURIComponent(encodeURIComponent(query));
}

export function decodeSearchQuery(query) {
    let pathname = decodeURIComponent(query);
    try {
        return decodeURIComponent(pathname);
    } catch (_error) {
        return pathname;
    }
}

export function escapeSearchValue(input) {
    if (typeof input === "string") {
        input = JSON.stringify(input);
    } else {
        input = String(input);
    }
    return input;
}

export function makeSearchLink(field, input, noEscape, endpoint) {
    if (input === undefined) return "";

    let prefix = field + ":";

    if (!noEscape) input = escapeSearchValue(input);
    return (
        `/${endpoint === undefined ? "search" : endpoint}?q=` +
        encodeSearchQuery(prefix + input)
    );
}

export function makeSearchRangeLink(field, from, to, endpoint) {
    return makeSearchLink(
        field,
        `[${escapeSearchValue(from)} TO ${escapeSearchValue(to)}]`,
        true,
        endpoint
    );
}

export function makeSearchDateLink(field, date, endpoint) {
    return makeSearchLink(
        field,
        new Date(date).toISOString().split("T")[0],
        true,
        endpoint
    );
}

export function queryFromHash(query, dhashOnly) {
    // SHA256
    if (/^[0-9a-fA-F]{64}$/g.test(query))
        if (dhashOnly) return `dhash:${query.toLowerCase()}`;
        else return `sha256:${query.toLowerCase()}`;
    // No SHA256 and dhashOnly? Time to stop
    if (dhashOnly) return query;
    // SHA1
    if (/^[0-9a-fA-F]{40}$/g.test(query)) return `sha1:${query.toLowerCase()}`;
    // MD5
    if (/^[0-9a-fA-F]{32}$/g.test(query)) return `md5:${query.toLowerCase()}`;
    // SHA512
    if (/^[0-9a-fA-F]{128}$/g.test(query))
        return `sha512:${query.toLowerCase()}`;
    return query;
}

export function addFieldToQuery(query, field, value) {
    const OP_NOT = "NOT ";
    const OP_AND = " AND ";
    const OP_PRE_AND = "AND ";

    let negateQueryComponent = (component) =>
        component.startsWith(OP_NOT)
            ? component.substring(OP_NOT.length)
            : OP_NOT + component;

    let queryComponent = `${field}:${escapeSearchValue(value)}`;
    if (!query) {
        query = queryComponent;
    } else {
        if (field.startsWith(OP_NOT)) {
            // Let ~negated query pass condition
            if (query.includes(queryComponent)) {
            }
            // Remove AND ~query
            else if (
                query.includes(OP_AND + negateQueryComponent(queryComponent))
            )
                query = query.replace(
                    OP_AND + negateQueryComponent(queryComponent),
                    ""
                );
            // Remove ~query
            else if (query.includes(negateQueryComponent(queryComponent)))
                query = query.replace(negateQueryComponent(queryComponent), "");
            // Add ~query
            else query = query + OP_AND + queryComponent;
        }
        // Remove AND ~negated query
        else if (query.includes(OP_AND + negateQueryComponent(queryComponent)))
            query = query.replace(
                OP_AND + negateQueryComponent(queryComponent),
                ""
            );
        // Remove ~negated query
        else if (query.includes(negateQueryComponent(queryComponent)))
            query = query.replace(negateQueryComponent(queryComponent), "");
        // Remove duplicated query
        else if (!query.includes(queryComponent))
            query = query + OP_AND + queryComponent;
    }

    query = query.trim();
    if (query.startsWith(OP_PRE_AND))
        query = query.substring(OP_PRE_AND.length);
    return query;
}
