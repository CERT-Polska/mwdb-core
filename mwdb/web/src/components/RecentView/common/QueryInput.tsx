import { lexQuery } from "@mwdb-web/components/RecentView/common/luceneLexer";
import {
    createEditor,
    Transforms,
    Text,
    Descendant,
    NodeEntry,
    DecoratedRange,
    Editor,
} from "slate";
import {
    Slate,
    Editable,
    withReact,
    RenderLeafProps,
    ReactEditor,
} from "slate-react";
import { withHistory } from "slate-history";
import {
    CSSProperties,
    forwardRef,
    useCallback,
    useEffect,
    useState,
} from "react";
import $ from "jquery";

const fieldDefinitions = {
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
    text_blob: {
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

const LPAR_TYPES: string[] = ["expr_lpar", "value_lpar", "value_lrange"];
const RPAR_TYPES: string[] = ["expr_rpar", "range_rrange"];
const FIELD_TYPES: string[] = ["expr_phrase", "expr_term"];
const FIELD_PART_TYPES: string[] = ["expr_arrayref", "expr_fieldsep"];
const OPER_TYPES: string[] = [
    "expr_notop",
    "expr_boolop",
    "range_toop",
    "value_compop",
];

type QueryAnnotation = {
    type: string;
    value: string;
    offset: number;
    lastOpenedBracket?: boolean;
    error?: string;
};

type AnnotatedQuery = {
    annotations: QueryAnnotation[];
    currentField: string[];
};

export function annotateQuery(query: string): AnnotatedQuery {
    const annotations: QueryAnnotation[] = [];
    const openedParentheses: QueryAnnotation[] = [];
    let currentField = [];

    let nextOffset = 0;
    let expectedTokens: string[] = [];
    try {
        if (!query.length) {
            let _rest;
            [_rest, _rest, expectedTokens] = lexQuery(" ").next().value;
        } else {
            for (const [token, _, nextTokens] of lexQuery(query)) {
                let tokenType: string = token.type as string;
                let annotation: QueryAnnotation = {
                    type: tokenType,
                    value: token.value,
                    offset: token.offset,
                };
                if (LPAR_TYPES.includes(tokenType)) {
                    if (openedParentheses.length > 0) {
                        openedParentheses[
                            openedParentheses.length - 1
                        ].lastOpenedBracket = false;
                    }
                    annotation.lastOpenedBracket = true;
                    openedParentheses.push(annotation);
                } else if (RPAR_TYPES.includes(tokenType)) {
                    openedParentheses[
                        openedParentheses.length - 1
                    ].lastOpenedBracket = false;
                    openedParentheses.pop();
                    if (openedParentheses.length > 0) {
                        openedParentheses[
                            openedParentheses.length - 1
                        ].lastOpenedBracket = true;
                    }
                } else if (FIELD_TYPES.includes(tokenType)) {
                    if (tokenType === "expr_phrase") {
                        currentField.push(JSON.parse(token.value));
                    } else {
                        currentField.push(token.value);
                    }
                } else if (!FIELD_PART_TYPES.includes(tokenType)) {
                    currentField = [];
                }
                annotations.push(annotation);
                nextOffset = token.offset + token.value.length;
                expectedTokens = nextTokens;
            }
        }
        if (expectedTokens.some((expected) => FIELD_TYPES.includes(expected))) {
            // If next expected token is field name part
            currentField.push("");
        } else if (
            !(
                annotations.length > 0 &&
                FIELD_TYPES.includes(annotations[annotations.length - 1].type)
            )
        ) {
            // Otherwise if last token is not field name part: reject fields
            currentField = [];
        }
    } catch (e: any) {
        annotations.push({
            type: "error",
            value: query.slice(nextOffset),
            error: e.toString(),
            offset: nextOffset,
        });
        currentField = [];
    }
    return { annotations, currentField };
}

function getSuggestions(currentField: string[]): string[] {
    if (!currentField.length) {
        return [];
    }
    const lastField = currentField[currentField.length - 1];
    const suggestionSet = Object.keys(fieldDefinitions.object).concat(
        Object.keys(fieldDefinitions.file)
    );
    return suggestionSet.filter((val) => val.startsWith(lastField));
}

const withSingleLine = (editor: ReactEditor): ReactEditor => {
    const { normalizeNode } = editor;

    editor.normalizeNode = ([node, path]) => {
        if (path.length === 0) {
            if (editor.children.length > 1) {
                Transforms.mergeNodes(editor);
            }
        }
        return normalizeNode([node, path]);
    };
    return editor;
};

function Leaf({ attributes, children, leaf }: RenderLeafProps) {
    let style: CSSProperties = {};
    let annotation: QueryAnnotation = (leaf as any).annotation;
    if (annotation) {
        if (annotation.lastOpenedBracket) {
            style["color"] = "aqua";
            style["fontWeight"] = "bolder";
        } else if (OPER_TYPES.includes(annotation.type)) {
            style["color"] = "blue";
        } else if (FIELD_TYPES.includes(annotation.type)) {
            style["color"] = "purple";
        } else if (annotation.type === "value_phrase") {
            style["color"] = "green";
        } else if (annotation.error) {
            style["textDecorationStyle"] = "wavy";
            style["textDecorationColor"] = "red";
            style["textDecorationLine"] = "underline";
            style["color"] = "red";
        }
    }
    return (
        <span style={style} {...attributes}>
            {children}
        </span>
    );
}

type QueryInputProps = {
    value: string;
    onChange: (currentValue: string) => void;
    onSubmit: () => void;
};

export function QueryInput(props: QueryInputProps) {
    const [editor, setEditor] = useState(() =>
        withSingleLine(withReact(withHistory(createEditor())))
    );
    const [value, setValue] = useState<Descendant[]>([
        {
            type: "paragraph",
            children: [{ text: props.value }],
        } as Descendant,
    ]);
    const [rawValue, setRawValue] = useState(props.value);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (rawValue === props.value) {
            return;
        }
        const children = [...editor.children];
        children.forEach((node) =>
            editor.apply({ type: "remove_node", path: [0], node })
        );
        editor.apply({
            type: "insert_node",
            path: [0],
            node: {
                type: "paragraph",
                children: [{ text: props.value }],
            } as Descendant,
        });
        setRawValue(props.value);
    }, [editor, props.value, rawValue, setRawValue]);

    useEffect(() => {
        if (typeof rawValue === "undefined") return;
        const { annotations, currentField } = annotateQuery(rawValue);
        setSuggestions((oldValue: string[]): string[] => {
            const toggleElement = $("#query-input") as any;
            const suggestions = getSuggestions(currentField);
            if (suggestions.length > 0) {
                toggleElement.dropdown("show");
                toggleElement.dropdown("update");
            } else {
                toggleElement.dropdown("hide");
            }
            return suggestions;
        });
    }, [rawValue]);

    const updateValue = useCallback(
        (newValue: any[]) => {
            setValue(newValue);
            let rawValue = newValue[0]?.children[0].text;
            if (typeof rawValue !== "undefined") {
                setRawValue(rawValue);
                props.onChange(rawValue);
            }
        },
        [setValue, props.onChange, setSuggestions]
    );

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                props.onSubmit();
            }
        },
        [props.onSubmit]
    );

    const decorate = useCallback(
        ([node, path]: NodeEntry): DecoratedRange[] => {
            if (!Text.isText(node)) return [];
            const ranges = [];
            const { annotations, currentField } = annotateQuery(node.text);
            for (let annotation of annotations) {
                ranges.push({
                    annotation,
                    anchor: { path, offset: annotation.offset },
                    focus: {
                        path,
                        offset: annotation.offset + annotation.value.length,
                    },
                });
            }
            return ranges;
        },
        []
    );

    const applySuggestion = useCallback(
        (suggestion: string) => {
            const { annotations, currentField } = annotateQuery(rawValue);
            const sliced = rawValue.slice(
                0,
                rawValue.length - currentField[currentField.length - 1].length
            );
            props.onChange(sliced + suggestion + ":");
            setTimeout(() => {
                ReactEditor.focus(editor);
                Transforms.select(editor, Editor.end(editor, []));
            }, 0);
        },
        [rawValue, props.onChange]
    );

    return (
        <>
            <Slate editor={editor} initialValue={value} onChange={updateValue}>
                <Editable
                    spellCheck={false}
                    decorate={decorate}
                    renderLeaf={Leaf}
                    placeholder="Search (Lucene query or hash)..."
                    onKeyDown={onKeyDown as any}
                    renderPlaceholder={({ children, attributes }) => (
                        <div {...attributes}>
                            <p>{children}</p>
                        </div>
                    )}
                    className="form-control small"
                    as={forwardRef(({ children, ...props }, ref) => (
                        <div
                            {...props}
                            ref={ref}
                            data-toggle="dropdown"
                            data-display="static"
                            id="query-input"
                        >
                            {children}
                        </div>
                    ))}
                    style={{
                        whiteSpace: "pre",
                        border: "1px solid gray",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        width: "250px",
                        overflowX: "auto",
                    }}
                />
                <div
                    className="dropdown-menu"
                    style={suggestions.length > 0 ? {} : { display: "none" }}
                >
                    {suggestions.map((suggestion) => {
                        return (
                            <button
                                className="dropdown-item small"
                                type="button"
                                key={suggestion}
                                onClick={() => {
                                    applySuggestion(suggestion);
                                }}
                            >
                                <div
                                    style={{
                                        width: "4rem",
                                        display: "inline-block",
                                    }}
                                >
                                    {suggestion}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </Slate>
        </>
    );
}
