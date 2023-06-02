import { useReducer, useState, useEffect } from "react";
import AceEditor from "react-ace";
import { RichAttributeRenderer } from "./RichAttributeRenderer";

import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-searchbox";

import { View } from "@mwdb-web/commons/ui";
import exampleTemplates, { makeContext } from "./exampleTemplates";

type TemplateReducerState = {
    chosenExample: string;
    templateInput: string;
    valueInput: string;
};

type TemplateReducerAction = {
    type: "edit" | "choose";
    chosenExample?: string;
    templateInput?: string;
    valueInput?: string;
};

function templateReducer(
    state: TemplateReducerState,
    action: TemplateReducerAction
): TemplateReducerState {
    if (action.type === "edit") {
        if (state.chosenExample === "custom") {
            // Editing custom template
            return {
                ...state,
                templateInput:
                    action.templateInput !== undefined
                        ? action.templateInput
                        : state.templateInput,
                valueInput:
                    action.valueInput !== undefined
                        ? action.valueInput
                        : state.valueInput,
            };
        } else {
            // Editing chosen example, apply secondary field from the chosen template
            return {
                chosenExample: "custom", // go to custom mode
                templateInput:
                    action.templateInput !== undefined
                        ? action.templateInput
                        : exampleTemplates[+state.chosenExample!].template,
                valueInput:
                    action.valueInput !== undefined
                        ? action.valueInput
                        : exampleTemplates[+state.chosenExample!].value,
            };
        }
    } else if (action.type === "choose") {
        // New example chosen. Remember custom fields but show new example
        return {
            ...state,
            chosenExample: action.chosenExample ?? "",
        };
    }
    return {
        ...state,
    };
}

type Props = {
    storedRichTemplate: string;
    storedExampleValue: string;
    onStore: (template: string, value: string) => void;
    onCancel: () => void;
    onDelete: () => void;
};

export function RichAttributePreview({
    storedRichTemplate,
    storedExampleValue,
    onStore,
    onCancel,
    onDelete,
}: Props) {
    const [templateState, dispatch] = useReducer(templateReducer, {
        chosenExample: "custom",
        templateInput: storedRichTemplate,
        valueInput: storedExampleValue,
    });
    const [showContext, setShowContext] = useState<boolean>(false);
    const [invalid, setInvalid] = useState<boolean>(false);
    const [contextValue, setContextValue] = useState<Object | null>(null);

    function chooseTemplate(ev: React.ChangeEvent<HTMLSelectElement>) {
        const index = ev.target.value;
        dispatch({ type: "choose", chosenExample: index });
    }

    function editTemplate(field: string, newValue: string) {
        dispatch({ type: "edit", [field]: newValue });
    }

    const template =
        templateState.chosenExample !== "custom"
            ? exampleTemplates[+templateState.chosenExample].template
            : templateState.templateInput;
    const value =
        templateState.chosenExample !== "custom"
            ? exampleTemplates[+templateState.chosenExample].value
            : templateState.valueInput;

    useEffect(() => {
        try {
            setContextValue(makeContext(JSON.parse(value)));
        } catch (e) {
            setContextValue(null);
            setInvalid(true);
        }
    }, [value, setContextValue, setInvalid]);

    return (
        <View ident="attributePreview">
            <select
                className="custom-select"
                value={templateState.chosenExample}
                onChange={chooseTemplate}
            >
                <option value="custom">(custom template)</option>
                {exampleTemplates.map((value, index) => (
                    <option key={index} value={index}>
                        {value.name}
                    </option>
                ))}
            </select>
            <div className="row">
                <div className="col-6">
                    <strong>Template</strong>
                    <AceEditor
                        mode="markdown"
                        theme="github"
                        value={template}
                        wrapEnabled
                        width="100%"
                        fontSize="16px"
                        onChange={(newTemplate) => {
                            editTemplate("templateInput", newTemplate);
                        }}
                        setOptions={{
                            useWorker: false,
                        }}
                    />
                </div>
                <div className="col-6">
                    <div className="form-check form-check-inline">
                        <strong>Example value</strong>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            id="showValue"
                            checked={!showContext}
                            onChange={() => setShowContext(false)}
                        />
                        <label className="form-check-label" htmlFor="showValue">
                            Value
                        </label>
                    </div>
                    <div className="form-check form-check-inline">
                        <input
                            className="form-check-input"
                            type="radio"
                            id="showContext"
                            checked={showContext}
                            onChange={() => setShowContext(true)}
                        />
                        <label
                            className="form-check-label"
                            htmlFor="showContext"
                        >
                            Context
                        </label>
                    </div>
                    <AceEditor
                        mode="json"
                        theme="github"
                        value={
                            showContext
                                ? JSON.stringify(contextValue, null, 4)
                                : value
                        }
                        wrapEnabled
                        readOnly={showContext}
                        width="100%"
                        fontSize="16px"
                        onChange={(newValue) => {
                            editTemplate("valueInput", newValue);
                        }}
                        setOptions={{
                            useWorker: false,
                        }}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <strong>Preview</strong>
                    <RichAttributeRenderer
                        template={template}
                        value={value}
                        setInvalid={setInvalid}
                    />
                </div>
            </div>
            <div className="btn-group">
                <button
                    type="button"
                    className="btn btn-success mr-1"
                    disabled={invalid}
                    onClick={(e) => {
                        if (!invalid) onStore(template, value);
                    }}
                >
                    Store
                </button>
                <button
                    type="button"
                    className="btn btn-danger mr-1"
                    onClick={() => onCancel()}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn btn-light mr-1"
                    onClick={() => onDelete()}
                >
                    Clear
                </button>
            </div>
        </View>
    );
}
