import { ObjectType } from "@mwdb-web/types/types";
import { useEffect, useState } from "react";
import {
    annotateQuery,
    FIELD_PART_TYPES,
    FIELD_TYPES,
    LPAR_TYPES,
    RPAR_TYPES,
} from "@mwdb-web/components/RecentView/common/luceneLexer";

export type QuerySuggestion = {
    suggestion: string;
    description?: string;
    apply?: (currentQuery: string) => string;
};

type FieldDefinition = {
    description: string;
    subfields?: boolean;
    subquery?: boolean;
};

const fieldDefinitions: Record<
    ObjectType,
    { [field: string]: FieldDefinition }
> = {
    object: {
        dhash: {
            description: "Data hash (sha256)",
        },
        tag: {
            description: "Query objects with provided tag",
        },
        comment: {
            description: "Query for comment contents",
        },
        meta: {
            description:
                "Query for object attribute value (alias for 'attribute')",
            subfields: true,
        },
        attribute: {
            description: "Query for object attribute value",
            subfields: true,
        },
        shared: {
            description: "Query for objects shared with provided user or group",
        },
        sharer: {
            description: "Query for objects shared by provided user or group",
        },
        uploader: {
            description: "Query for objects uploaded by provided user or group",
        },
        upload_time: {
            description: "Query for objects uploaded at provided timestamp",
        },
        parent: {
            description:
                "Query for objects having parent that matches the condition",
            subquery: true,
        },
        child: {
            description:
                "Query for objects having child that matches the condition",
            subquery: true,
        },
        favorites: {
            description: "Query for favorite objects of given user",
        },
        karton: {
            description:
                "Query for objects related with Karton analysis identifier",
        },
        comment_author: {
            description: "Query for objects commented by given user",
        },
        upload_count: {
            description:
                "Query for objects uploaded by given amount of users (including parents)",
        },
    },
    file: {
        name: {
            description: "Query for file having a provided name",
        },
        size: {
            description: "Query for file having a provided size",
        },
        type: {
            description: "Query for file having a provided magic type",
        },
        md5: {
            description: "Query for file having a provided MD5 hash",
        },
        sha1: {
            description: "Query for file having a provided SHA1 hash",
        },
        sha256: {
            description: "Query for file having a provided SHA256 hash",
        },
        sha512: {
            description: "Query for file having a provided SHA512 hash",
        },
        ssdeep: {
            description: "Query for file having a provided ssdeep hash",
        },
        crc32: {
            description: "Query for file having a provided crc32 hash",
        },
        multi: {
            description: "Query for file that matches provided list of IoCs",
        },
    },
    config: {
        type: {
            description: "Query for config having a provided config type",
        },
        family: {
            description: "Query for config for provided malware family",
        },
        cfg: {
            description: "Query for config field value",
            subfields: true,
        },
        multi: {
            description: "Query for config that matches provided list of IoCs",
        },
    },
    blob: {
        name: {
            description: "Query for blob having a provided name",
        },
        size: {
            description: "Query for blob having a provided size",
        },
        type: {
            description: "Query for blob having a provided type",
        },
        content: {
            description: "Query for blob contents",
        },
        first_seen: {
            description:
                "Query for blob uploaded first time at provided timestamp",
        },
        last_seen: {
            description:
                "Query for blob uploaded last time at provided timestamp",
        },
        multi: {
            description: "Query for blob that matches provided list of IoCs",
        },
    },
};

function getCurrentField(currentQuery: string): [string[], boolean] {
    /**
     * Returns current field path and boolean indicating if we're inside subquery
     * If current field path is an empty array: there is no pending field input
     */
    const annotatedQuery = annotateQuery(currentQuery);
    let currentField: string[] = [];
    let bracketStack: string[] = [];
    for (let annotation of annotatedQuery.annotations) {
        if (FIELD_TYPES.includes(annotation.type)) {
            currentField.push(annotation.value);
        } else if (!FIELD_PART_TYPES.includes(annotation.type)) {
            currentField = [];
        }

        if (LPAR_TYPES.includes(annotation.type)) {
            bracketStack.push(annotation.type);
        } else if (RPAR_TYPES.includes(annotation.type)) {
            bracketStack.pop();
        }
    }
    if (
        annotatedQuery.nextPossibleTokens.some((tokenType) =>
            FIELD_TYPES.includes(tokenType)
        )
    ) {
        currentField.push("");
    }
    console.log(bracketStack);
    return [
        currentField,
        bracketStack.some((fieldType) => fieldType === "value_lpar"),
    ];
}

function makeSuggestion(
    lastField: string,
    fieldName: string,
    definition: FieldDefinition,
    prefix: string = ""
): QuerySuggestion | null {
    let suggestion = prefix + fieldName;
    if (!suggestion.startsWith(lastField)) {
        return null;
    }
    if (definition.subquery) {
        suggestion += ":(";
    } else if (definition.subfields) {
        suggestion += ".";
    } else {
        suggestion += ":";
    }
    return {
        suggestion,
        description: definition.description,
        apply: (currentQuery) =>
            currentQuery.slice(0, currentQuery.length - lastField.length) +
            suggestion,
    };
}

function getSuggestions(currentQuery: string, objectType: ObjectType) {
    const [currentField, insideSubquery] = getCurrentField(currentQuery);
    const suggestions: QuerySuggestion[] = [];
    if (!currentField.length) return [];
    let lastField = currentField[currentField.length - 1];
    // Handle untyped query
    if (objectType === "object" || insideSubquery) {
        if (currentField.length === 1) {
            // If doesn't contain type selector: generate untyped and typed suggestions
            for (let objectField of Object.keys(fieldDefinitions.object)) {
                let suggestion = makeSuggestion(
                    lastField,
                    objectField,
                    fieldDefinitions.object[objectField]
                );
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            }
            for (let objectType of ["file", "config", "blob"] as ObjectType[]) {
                for (let typedField of Object.keys(
                    fieldDefinitions[objectType]
                )) {
                    let suggestion = makeSuggestion(
                        lastField,
                        typedField,
                        fieldDefinitions[objectType][typedField],
                        objectType + "."
                    );
                    if (suggestion) {
                        suggestions.push(suggestion);
                    }
                }
            }
            return suggestions;
        } else {
            // If contains type selector: set it as object type
            if (Object.keys(fieldDefinitions).includes(currentField[0])) {
                objectType = currentField.shift() as ObjectType;
            }
        }
    }
    if (currentField.length === 1) {
        const definitions = {
            ...fieldDefinitions.object,
            ...fieldDefinitions[objectType],
        };
        for (let field of Object.keys(definitions)) {
            let suggestion = makeSuggestion(
                lastField,
                field,
                definitions[field]
            );
            if (suggestion) {
                suggestions.push(suggestion);
            }
        }
        return suggestions;
    }
    return [];
}

export function useQuerySuggestions(
    currentQuery: string,
    objectType: ObjectType
): [QuerySuggestion[], boolean] {
    const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const suggestions = getSuggestions(currentQuery, objectType);
        setSuggestions(suggestions);
    }, [currentQuery, objectType, setSuggestions]);

    return [suggestions, loading];
}
