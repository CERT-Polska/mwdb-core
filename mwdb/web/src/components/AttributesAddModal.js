import React, { useRef, useState, useEffect, useCallback } from "react";

import api from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

export default function AttributesAddModal({ isOpen, onAdd, onRequestClose }) {
    const [attributeDefinitions, setAttributeDefinitions] = useState({});
    const [attributeKey, setAttributeKey] = useState("");
    const [attributeValue, setAttributeValue] = useState("");
    const attributeForm = useRef(null);

    function handleSubmit(ev) {
        if (ev) ev.preventDefault();
        if (!attributeForm.current.reportValidity()) return;
        onAdd(attributeKey, attributeValue);
    }

    function handleKeyChange(ev) {
        setAttributeKey(ev.target.value);
    }

    function handleValueChange(ev) {
        setAttributeValue(ev.target.value);
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
            console.log(keyDefinitions);
            setAttributeDefinitions(keyDefinitions);
        } catch (error) {
            console.log(error);
        }
    }

    const getAttributeDefinitions = useCallback(updateAttributeDefinitions, []);

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
        >
            {!Object.keys(attributeDefinitions).length ? (
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
                            <div className="form-hint">
                                {attributeDefinitions[attributeKey].description}
                            </div>
                        ) : (
                            []
                        )}
                    </div>
                    <div className="form-group">
                        <label>Value</label>
                        <input
                            type="text"
                            className="form-control"
                            onChange={handleValueChange}
                            value={attributeValue}
                            required
                        />
                    </div>
                </form>
            )}
        </ConfirmationModal>
    );
}
