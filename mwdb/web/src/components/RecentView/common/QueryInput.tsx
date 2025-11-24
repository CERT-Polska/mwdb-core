import React, {
    CSSProperties,
    forwardRef,
    useCallback,
    useEffect,
    useState,
} from "react";
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
import $ from "jquery";
import {
    FIELD_TYPES,
    annotateQuery,
    QueryAnnotation,
    OPER_TYPES,
} from "../common/luceneLexer";
import { QuerySuggestion } from "./useQuerySuggestions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

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
            // Style of opened bracket
            style = {
                color: "aqua",
                fontWeight: "bolder",
            };
        } else if (OPER_TYPES.includes(annotation.type)) {
            // Style of keyword operators
            style = {
                color: "blue",
            };
        } else if (FIELD_TYPES.includes(annotation.type)) {
            // Style of field names
            style = {
                color: "purple",
            };
        } else if (
            ["value_phrase", "value_phrase_unfin"].includes(annotation.type)
        ) {
            // Style of quoted value (phrase)
            style = {
                color: "green",
            };
        } else if (annotation.error) {
            // Style of fragment with syntax error
            style = {
                textDecorationLine: "underline",
                textDecorationColor: "red",
                textDecorationStyle: "wavy",
                color: "red",
            };
        }
    }
    return (
        <span style={style} {...attributes}>
            {children}
        </span>
    );
}

type SuggestionButtonProps = {
    children: React.ReactNode;
    description?: string;
    onClick?: React.MouseEventHandler;
};

function SuggestionButton({
    children,
    description,
    onClick,
}: SuggestionButtonProps) {
    return (
        <button className="dropdown-item small" type="button" onClick={onClick}>
            <div
                style={{
                    width: "4rem",
                    display: "inline-block",
                }}
            >
                {children}
            </div>
            {description ? <div className="text-muted">{description}</div> : []}
        </button>
    );
}

type QueryInputProps = {
    value: string;
    onChange: (currentValue: string) => void;
    onSubmit: () => void;
    suggestions: QuerySuggestion[];
    loadingSuggestions: boolean;
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
    const showSuggestions =
        props.suggestions.length > 0 || props.loadingSuggestions;

    useEffect(() => {
        if (rawValue === props.value) {
            return;
        }
        // There is no easy way in Slate to update text value
        // Fortunately, our Descendant tree contains only single
        // text node, thanks to "withSingleLine"
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
        const toggleElement = $("#query-input") as any;
        if (showSuggestions && ReactEditor.isFocused(editor)) {
            toggleElement.dropdown("show");
            toggleElement.dropdown("update");
        } else {
            toggleElement.dropdown("hide");
        }
    }, [showSuggestions, editor]);

    const updateValue = useCallback(
        (newValue: any[]) => {
            setValue(newValue);
            let rawValue = newValue[0]?.children[0].text;
            if (typeof rawValue !== "undefined") {
                setRawValue(rawValue);
                props.onChange(rawValue);
            }
        },
        [setValue, props.onChange]
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
            const { annotations } = annotateQuery(node.text);
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
        (applyFn: (value: string) => string) => {
            props.onChange(applyFn(rawValue));
            // Recover focus onto QueryInput
            // We need to do it after other actions in event loop
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
                        overflowX: "hidden",
                    }}
                />
                <div
                    className="dropdown-menu"
                    style={{
                        maxHeight: "8rem",
                        overflowY: "auto",
                        ...(!props.loadingSuggestions &&
                        props.suggestions.length == 0
                            ? { visibility: "hidden" }
                            : {}),
                    }}
                >
                    {!props.loadingSuggestions ? (
                        props.suggestions.map((suggestion: QuerySuggestion) => {
                            return (
                                <SuggestionButton
                                    key={suggestion.suggestion}
                                    description={suggestion.description}
                                    onClick={() => {
                                        if (suggestion.apply)
                                            applySuggestion(suggestion.apply);
                                    }}
                                >
                                    {suggestion.suggestion}
                                </SuggestionButton>
                            );
                        })
                    ) : (
                        <SuggestionButton description="Loading suggestion">
                            <FontAwesomeIcon icon={faSpinner} spin />
                        </SuggestionButton>
                    )}
                </div>
            </Slate>
        </>
    );
}
