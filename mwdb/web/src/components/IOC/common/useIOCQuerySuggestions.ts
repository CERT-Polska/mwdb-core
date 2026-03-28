import { useState, useEffect } from "react";
import {
    annotateQuery,
    FIELD_TYPES,
    FIELD_PART_TYPES,
} from "@mwdb-web/components/RecentView/common/luceneLexer";

type FieldDefinition = {
    description: string;
};

export type QuerySuggestion = {
    suggestion: string;
    description: string;
    apply: (currentQuery: string) => string;
};

const iocFieldDefinitions: Record<string, FieldDefinition> = {
    type: {
        description:
            "IOC type (ip, domain, url, port, email, mutex, registry_key, user_agent)",
    },
    value: {
        description: "IOC value (supports wildcards, e.g. 192.168.*)",
    },
    category: {
        description: "IOC category (e.g. c2, malware, phishing)",
    },
    severity: {
        description:
            "IOC severity (low, medium, high, critical)",
    },
    creation_time: {
        description: "IOC creation time (e.g. 2024-01-01, >1d)",
    },
    tag: {
        description: "IOC tag value",
    },
};

function getCurrentField(currentQuery: string): string[] {
    const annotatedQuery = annotateQuery(currentQuery);
    let currentField: string[] = [];
    for (const annotation of annotatedQuery.annotations) {
        if (FIELD_TYPES.includes(annotation.type)) {
            currentField.push(annotation.value);
        } else if (!FIELD_PART_TYPES.includes(annotation.type)) {
            currentField = [];
        }
    }
    if (
        annotatedQuery.nextPossibleTokens.some((tokenType: string) =>
            FIELD_TYPES.includes(tokenType)
        )
    ) {
        currentField.push("");
    }
    return currentField;
}

function fetchSuggestions(currentQuery: string): QuerySuggestion[] {
    const currentField = getCurrentField(currentQuery);
    if (!currentField.length) return [];
    if (currentField.length !== 1) return [];

    const partialInput = currentField[0];
    const suggestions: QuerySuggestion[] = [];

    for (const [fieldName, definition] of Object.entries(
        iocFieldDefinitions
    )) {
        const suggestion = fieldName + ":";
        if (!suggestion.startsWith(partialInput)) continue;
        suggestions.push({
            suggestion,
            description: definition.description,
            apply: (query) =>
                query.slice(0, query.length - partialInput.length) +
                suggestion,
        });
    }
    return suggestions;
}

export function useIOCQuerySuggestions(
    currentQuery: string
): [QuerySuggestion[], boolean] {
    const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);

    useEffect(() => {
        setSuggestions(fetchSuggestions(currentQuery));
    }, [currentQuery]);

    return [suggestions, false];
}
