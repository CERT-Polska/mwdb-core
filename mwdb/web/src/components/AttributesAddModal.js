import React, { useRef, useState, useEffect, useCallback } from "react";

import api from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import RichAttributeRenderer from "./RichAttribute/RichAttributeRenderer";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-searchbox";

export default function AttributesAddModal({ isOpen, onAdd, onRequestClose }) {
    const [attributeDefinitions, setAttributeDefinitions] = useState({});
    const [attributeKey, setAttributeKey] = useState("");
    const [richTemplate, setRichTemplate] = useState("");
    const [richExampleValue, setRichExampleValue] = useState("");
    const [attributeValue, setAttributeValue] = useState("");
    const [attributeType, setAttributeType] = useState("string");
    const [invalid, setInvalid] = useState(false);
    const [error, setError] = useState(null);
    const attributeForm = useRef(null);

    function handleSubmit(ev) {
        if (ev) ev.preventDefault();
        if (!attributeForm.current.reportValidity()) return;
        let value = attributeValue;
        if (attributeType === "object") {
            try {
                value = JSON.parse(attributeValue);
            } catch (e) {
                setError(e.toString());
                return;
            }
        }
        onAdd(attributeKey, value);
    }

    function handleKeyChange(ev) {
        setAttributeKey(ev.target.value);
        if (!ev.target.value.length) setRichTemplate("");
        else {
            setRichTemplate(
                attributeDefinitions[ev.target.value].rich_template
            );
            if (attributeDefinitions[ev.target.value].example_value) {
                setRichExampleValue(
                    attributeDefinitions[ev.target.value].example_value
                );
            }
        }

        setError(null);
    }

    function handleValueChange(ev) {
        setAttributeValue(ev.target.value);
        setError(null);
    }

    function handleTypeChange(ev) {
        setAttributeType(ev.target.value);
        setError(null);
    }

    async function updateAttributeDefinitions() {
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
        } catch (error) {
            setError(error.toString());
        }
    }

    const getAttributeDefinitions = useCallback(updateAttributeDefinitions, []);
    const attributesAvailable = Object.keys(attributeDefinitions).length !== 0;

    useEffect(() => {
        getAttributeDefinitions();
    }, [getAttributeDefinitions]);

    return (
        <ConfirmationModal
            buttonStyle="btn-success"
            confirmText="Add"
            message="Add attribute"
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            onConfirm={handleSubmit}
            confirmDisabled={!attributesAvailable || (invalid && richTemplate)}
        >
            {error ? (
                <div
                    className="alert alert-danger"
                    style={{ "max-width": "300px" }}
                >
                    {error}
                </div>
            ) : (
                []
            )}
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
                            onChange={handleKeyChange}
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
                                onClick={handleTypeChange}
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
                                onClick={handleTypeChange}
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
                                placeholder={richExampleValue}
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
                    {richTemplate && attributeType === "object" ? (
                        <div className="form-group">
                            <label>Rich attribute preview</label>
                            <table
                                className="table table-striped table-bordered table-hover data-table"
                                style={{
                                    width: `500px`,
                                }}
                            >
                                <tbody>
                                    <RichAttributeRenderer
                                        template={richTemplate}
                                        value={attributeValue}
                                        setInvalid={setInvalid}
                                    />
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        []
                    )}
                </form>
            )}
        </ConfirmationModal>
    );
}
