import React, { useEffect, useState } from "react";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

export default function QuickQueryAddModal(props) {
    const { isOpen, onSubmit, onRequestModalClose, error, onError } = props;
    const [value, setValue] = useState("");

    useEffect(() => {
        if (!isOpen) {
            setValue("");
        }
    }, [isOpen]);

    const handleSubmit = (ev) => {
        if (!value) {
            onError("Please set name for your quick query.");
        } else {
            ev.preventDefault();
            onSubmit(value);
        }
    };

    const handleClose = (ev) => {
        ev.preventDefault();
        onRequestModalClose(value);
    };

    return (
        <ConfirmationModal
            buttonStyle="btn-success"
            confirmText="Add"
            message="Add new custom quick query"
            isOpen={isOpen}
            onRequestClose={handleClose}
            onConfirm={handleSubmit}
        >
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    className={`form-control ${
                        error ? "is-invalid" : ""
                    }`.trim()}
                    style={{ width: "470px" }}
                    placeholder="Set name for your quick query"
                    value={value}
                    onChange={(ev) => setValue(ev.target.value)}
                    name="name"
                    required
                />
                {error && <p className="invalid-feedback">{error}</p>}
            </form>
        </ConfirmationModal>
    );
}
