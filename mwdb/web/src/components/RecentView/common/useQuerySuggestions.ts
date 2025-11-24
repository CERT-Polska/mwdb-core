import { AttributeDefinition, ObjectType } from "@mwdb-web/types/types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    annotateQuery,
    FIELD_PART_TYPES,
    FIELD_TYPES,
    LPAR_TYPES,
    RPAR_TYPES,
} from "@mwdb-web/components/RecentView/common/luceneLexer";
import { api } from "@mwdb-web/commons/api";
import { toast } from "react-toastify";

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
        // If next field name part is expected, but there is no token: put empty string
        currentField.push("");
    }
    return [
        currentField,
        bracketStack.some((fieldType) => fieldType === "value_lpar"),
    ];
}

function makeSuggestion(
    partialInput: string,
    suggestedInput: string,
    definition: FieldDefinition,
    prefix: string = ""
): QuerySuggestion | null {
    let suggestion = prefix + suggestedInput;
    if (!suggestion.startsWith(partialInput)) {
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
            currentQuery.slice(0, currentQuery.length - partialInput.length) +
            suggestion,
    };
}

async function fetchSuggestions(
    currentQuery: string,
    objectType: ObjectType,
    subfieldSuggestionGetters: Record<
        string,
        (currentField: string[]) => Promise<QuerySuggestion[]>
    >
): Promise<QuerySuggestion[]> {
    const [currentField, insideSubquery] = getCurrentField(currentQuery);
    const suggestions: QuerySuggestion[] = [];
    if (!currentField.length) return [];
    let lastField = currentField[currentField.length - 1];
    // Handle untyped query
    if (objectType === "object" || insideSubquery) {
        if (currentField.length === 1) {
            // If doesn't contain type selector: generate untyped...
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
            // ... and then typed suggestions with type selector prefix
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
            // and shift currentField
            if (Object.keys(fieldDefinitions).includes(currentField[0])) {
                objectType = currentField.shift() as ObjectType;
            }
        }
    }
    // Here type selector is gone
    if (currentField.length === 1) {
        // If current field path doesn't contain any subfields
        // then get field suggestions
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
    } else {
        // If we're in the subfield, it's possible
        // that we need to fetch suggestion information
        // from API
        const getSubfieldSuggestion =
            subfieldSuggestionGetters[currentField[0]];
        if (!getSubfieldSuggestion) {
            return [];
        }
        return await getSubfieldSuggestion(currentField);
    }
}

function getStructureFromValue(value: any): any {
    if (Array.isArray(value)) {
        let structure = {};
        for (let el of value) {
            Object.assign(structure, getStructureFromValue(el));
        }
        return structure;
    } else if (typeof value === "object") {
        let structure: { [key: string]: any } = {};
        for (let [key, val] of Object.entries(value)) {
            structure[key] = getStructureFromValue(val);
        }
        return structure;
    } else {
        return {};
    }
}

type AttributesStructure = {
    descriptions: { [key: string]: string };
    values: { [key: string]: any };
};

function getAttributesStructure(
    attributeDefinitions: AttributeDefinition[]
): AttributesStructure {
    const values: { [key: string]: any } = {};
    const descriptions: { [key: string]: string } = {};
    for (let attributeDefinition of attributeDefinitions) {
        descriptions[attributeDefinition.key] = attributeDefinition.description;
        values[attributeDefinition.key] = {};
        if (attributeDefinition.example_value) {
            try {
                const exampleValue = JSON.parse(
                    attributeDefinition.example_value
                );
                values[attributeDefinition.key] =
                    getStructureFromValue(exampleValue);
            } catch (e) {
                console.error(
                    "Failed to parse example value, ignoring that attribute definition"
                );
            }
        }
    }
    return { descriptions, values };
}

function useAttributesStructure(): () => Promise<AttributesStructure> {
    // We want to fetch attributes only once, but there may be multiple requests for it
    // as user is typing the search input containing "attribute." field.
    // That's why:
    // - we create promise only once and then use it multiple times
    //   (multiple loader invocations await on the same promise)
    // - resolved promise effectively keeps the information about attributes
    const promise = useRef<Promise<AttributesStructure> | null>(null);
    return useCallback(async () => {
        if (!promise.current) {
            promise.current = new Promise((resolve, reject) => {
                api.getAttributeDefinitions("read")
                    .then((response) => {
                        let attributesStructure = getAttributesStructure(
                            response.data["attribute_definitions"]
                        );
                        resolve(attributesStructure);
                    })
                    .catch((error) => {
                        toast(error.toString(), { type: "error" });
                    });
            });
        }
        return await promise.current;
    }, []);
}

function getAttributeSuggestions(
    currentField: string[],
    attributeStructure: AttributesStructure
): QuerySuggestion[] {
    if (currentField.length <= 1) return [];
    if (currentField.length == 2) {
        let suggestions = [];
        for (let attributeKey of Object.keys(attributeStructure.descriptions)) {
            let suggestion = makeSuggestion(currentField[1], attributeKey, {
                description: attributeStructure.descriptions[attributeKey],
                subfields:
                    Object.keys(attributeStructure.values[attributeKey] || {})
                        .length > 0,
            });
            if (suggestion) suggestions.push(suggestion);
        }
        return suggestions;
    } else {
        let suggestions = [];
        const attributeKey = currentField[1];
        let values = attributeStructure.values[attributeKey] || {};
        for (let field of currentField.slice(2, currentField.length - 1)) {
            if (!Object.keys(values[field] || {}).length) {
                return [];
            }
            values = values[field] || {};
        }
        let lastField = currentField[currentField.length - 1];
        for (let subfield of Object.keys(values)) {
            let suggestion = makeSuggestion(lastField, subfield, {
                description: "",
                subfields: Object.keys(values[subfield] || {}).length > 0,
            });
            if (suggestion) suggestions.push(suggestion);
        }
        return suggestions;
    }
}

export function useQuerySuggestions(
    currentQuery: string,
    objectType: ObjectType
): [QuerySuggestion[], boolean] {
    const loadAttributesStructure = useAttributesStructure();
    const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchAttributeSuggestions = useCallback(
        async (currentField: string[]) => {
            let attributesStructure = await loadAttributesStructure();
            return getAttributeSuggestions(currentField, attributesStructure);
        },
        [loadAttributesStructure]
    );

    useEffect(() => {
        let valid = true;
        fetchSuggestions(currentQuery, objectType, {
            attribute: fetchAttributeSuggestions,
            meta: fetchAttributeSuggestions,
        }).then((suggestions) => {
            if (valid) {
                setSuggestions(suggestions);
                setLoading(false);
            }
        });
        setLoading(true);
        return () => {
            valid = false;
        };
    }, [currentQuery, objectType, setSuggestions, fetchAttributeSuggestions]);

    return [suggestions, loading];
}
