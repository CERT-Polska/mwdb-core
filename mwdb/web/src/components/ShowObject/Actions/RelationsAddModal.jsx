import React, { useState } from "react";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

export default function RelationsAddModal(props) {
    const [relation, setRelation] = useState("");
    const [value, setValue] = useState("");
    const [relationError, setRelationError] = useState("");

    function handleClose(ev) {
        ev.preventDefault();
        setRelation("");
        setValue("");
        setRelationError("");
        props.onRequestModalClose();
    }

    function handleSubmit(ev) {
        ev.preventDefault();
        if (["parent", "child"].indexOf(relation) === -1) {
            setRelationError("Please select parent or child relationship.");
            return;
        }
        setRelationError("");
        props.onSubmit(relation, value);
    }

    return (
        <ConfirmationModal
            buttonStyle="btn-success"
            confirmText="Add"
            message="Add relation"
            isOpen={props.isOpen}
            onRequestClose={handleClose}
            onConfirm={handleSubmit}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Relationship</label>
                    <select
                        className={`form-control ${
                            relationError ? "is-invalid" : ""
                        }`.trim()}
                        value={relation}
                        onChange={(ev) => setRelation(ev.target.value)}
                        style={{ width: 200 }}
                    >
                        <option value="" hidden>
                            Select relationship
                        </option>
                        <option value="parent">parent</option>
                        <option value="child">child</option>
                    </select>
                    {relationError && (
                        <p className="invalid-feedback">{relationError}</p>
                    )}
                </div>
                <div className="form-group">
                    <label>sha256 Identifier</label>
                    <input
                        type="text"
                        className="form-control"
                        style={{ width: 600 }}
                        placeholder="Type object sha256 identifier..."
                        onChange={(ev) => setValue(ev.target.value)}
                        value={value}
                        required
                    />
                </div>
            </form>
        </ConfirmationModal>
    );
}
