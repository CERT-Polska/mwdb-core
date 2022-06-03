import React, { useState } from "react";
import { Alert, ConfirmationModal } from "@mwdb-web/commons/ui";

export default function QuickQueryAddModal(props) {
    const [value, setValue] = useState("");

    const handleSubmit = (ev) => {
        if (!value) {
            props.onError("Please set name for your quick query.");
        } else {
            ev.preventDefault();
            props.onSubmit(value);
        }
    };

    const handleClose = (ev) => {
        ev.preventDefault();
        props.onRequestModalClose(value);
    };

    return (
        <ConfirmationModal
            buttonStyle="btn-success"
            confirmText="Add"
            message="Add new custom quick query"
            isOpen={props.isOpen}
            onRequestClose={handleClose}
            onConfirm={handleSubmit}
        >
            <form onSubmit={handleSubmit}>
                <Alert error={props.error} />
                <div className="row pb-2">
                    <input
                        type="text"
                        className="form-control"
                        style={{ width: "470px" }}
                        placeholder="Set name for your quick query"
                        onChange={(ev) => setValue(ev.target.value)}
                        name="name"
                        required
                    />
                </div>
            </form>
        </ConfirmationModal>
    );
}
