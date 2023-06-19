import React, { useState, useEffect, useRef } from "react";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";

import { api } from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { RichAttributeRenderer } from "./RichAttribute/RichAttributeRenderer";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-searchbox";
import { AttributeDefinition } from "@mwdb-web/types/types";

type Props = {
    isOpen: boolean;
    onAdd: (attributeKey: string, value: string) => void;
    onRequestClose: (e: React.MouseEvent) => void;
};

export function AttributesAddModal({ isOpen, onAdd, onRequestClose }: Props) {
    const [attributeDefinitions, setAttributeDefinitions] = useState<
        Record<string, AttributeDefinition>
    >({});
    const [attributeKey, setAttributeKey] = useState<string>("");
    const [richTemplate, setRichTemplate] = useState<string>("");
    const [attributeValue, setAttributeValue] = useState<string>("");
    const [attributeType, setAttributeType] = useState<string>("string");
    const [invalid, setInvalid] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const attributeForm = useRef<HTMLFormElement>(null);
    const attributesAvailable = !isEmpty(attributeDefinitions);

    useEffect(() => {
        getAttributeDefinitions();
    }, []);

    function handleSubmit(ev: React.MouseEvent<HTMLFormElement>) {
        if (ev) ev.preventDefault();
        if (!attributeForm.current?.reportValidity()) return;
        let value = attributeValue;
        if (attributeType === "object") {
            try {
                value = JSON.parse(attributeValue);
            } catch (e: any) {
                setError(e.toString());
                return;
            }
        }
        onAdd(attributeKey, value);
    }

    function handleKeyChange(ev: React.ChangeEvent<HTMLSelectElement>) {
        setAttributeKey(ev.target.value);
        if (!ev.target.value.length) setRichTemplate("");
        else {
            setRichTemplate(
                attributeDefinitions[ev.target.value].rich_template
            );
            setAttributeValue(
                attributeDefinitions[ev.target.value].example_value || ""
            );
        }
        setAttributeType("object");

        setError(null);
    }

    function handleValueChange(ev: React.ChangeEvent<HTMLInputElement>) {
        setAttributeValue(ev.target.value);
        setError(null);
    }

    function handleTypeChange(ev: React.ChangeEvent<HTMLInputElement>) {
        setAttributeType(ev.target.value);
        setError(null);
    }

    async function getAttributeDefinitions() {
        try {
            const response = await api.getAttributeDefinitions("set");
            const keyDefinitions = response.data[
                "attribute_definitions"
            ].reduce(
                (agg, definition) => ({
                    ...agg,
                    [definition.key]: definition,
                }),
                {}
            );
            setAttributeDefinitions(keyDefinitions);
        } catch (error: any) {
            toast(error.toString(), { type: "error" });
        }
    }

    return (
        <ConfirmationModal
            buttonStyle="btn-success"
            confirmText="Add"
            message="Add attribute"
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            onConfirm={handleSubmit}
            confirmDisabled={
                !attributesAvailable || (invalid && !isEmpty(richTemplate))
            }
        >
            {!attributesAvailable ? (
                <div>
                    Sorry, there are no attributes you can set at this moment.
                </div>
            ) : (
                <form onSubmit={handleSubmit} ref={attributeForm}>
                    <div className="form-group">
                        <label>Attribute</label>
                        <select
                            className="form-control"
                            onChange={(e) => handleKeyChange(e)}
                            value={attributeKey}
                            required
                        >
                            <option key="" value="">
                                &nbsp;
                            </option>
                            {Object.keys(attributeDefinitions)
                                .sort()
                                .map((attr) => (
                                    <option key={attr} value={attr}>
                                        {attributeDefinitions[attr].label ||
                                            attributeDefinitions[attr].key}{" "}
                                        {attributeDefinitions[attr].label &&
                                            `(${attributeDefinitions[attr].key})`}
                                    </option>
                                ))}
                        </select>
                        {attributeDefinitions[attributeKey] &&
                        attributeDefinitions[attributeKey].description ? (
                            <div className="form-group pt-2">
                                {attributeDefinitions[attributeKey].description}
                            </div>
                        ) : (
                            []
                        )}
                    </div>
                    <div className="form-group">
                        <div className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="radio"
                                id="value-string"
                                name="value-type"
                                checked={attributeType === "string"}
                                value="string"
                                onChange={handleTypeChange}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="value-string"
                            >
                                String
                            </label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="radio"
                                id="value-object"
                                name="value-type"
                                checked={attributeType === "object"}
                                value="object"
                                onChange={handleTypeChange}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="value-object"
                            >
                                Object
                            </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Value</label>
                        {attributeType === "string" ? (
                            <input
                                type="text"
                                className="form-control"
                                onChange={handleValueChange}
                                value={attributeValue}
                                required
                            />
                        ) : (
                            <AceEditor
                                mode="json"
                                theme="github"
                                wrapEnabled
                                onChange={(input) => setAttributeValue(input)}
                                value={attributeValue}
                                width="500px"
                                height="150px"
                                setOptions={{
                                    useWorker: false,
                                }}
                            />
                        )}
                    </div>
                    {richTemplate ? (
                        <div className="form-group">
                            <label>Rich attribute preview</label>
                            <table
                                className="table table-striped table-bordered table-hover data-table"
                                style={{
                                    width: `500px`,
                                }}
                            >
                                <tbody>
                                    <tr>
                                        <th>{"My attribute"}</th>
                                        <td>
                                            <RichAttributeRenderer
                                                template={richTemplate}
                                                value={
                                                    attributeType === "string"
                                                        ? JSON.stringify(
                                                              attributeValue
                                                          )
                                                        : attributeValue
                                                }
                                                setInvalid={setInvalid}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        []
                    )}
                    <p
                        className="invalid-feedback"
                        style={{
                            display: error ? "block" : "none",
                        }}
                    >
                        {error}
                    </p>
                </form>
            )}
        </ConfirmationModal>
    );
}
