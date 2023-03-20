import React, { useState } from "react";
import { toast } from "react-toastify";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

export default function RelationsAddModal(props) {
    const [relation, setRelation] = useState("");
    const [value, setValue] = useState("");

    function handleClose(ev) {
        ev.preventDefault();
        setRelation("");
        setValue("");
        props.onRequestModalClose();
    }

    function handleSubmit(ev) {
        ev.preventDefault();
        if (["parent", "child"].indexOf(relation) === -1) {
            toast("Please select parent or child relationship.", {
                type: "error",
            });
            return;
        }
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
                <table>
                    <tr>
                        <td>
                            <select
                                className="form-control"
                                value={relation}
                                onChange={(ev) => setRelation(ev.target.value)}
                            >
                                <option value="" hidden>
                                    Select relationship
                                </option>
                                <option value="parent">parent</option>
                                <option value="child">child</option>
                            </select>
                        </td>
                        <td>
                            <input
                                type="text"
                                className="form-control"
                                style={{ width: "600px" }}
                                placeholder="Type object sha256 identifier..."
                                onChange={(ev) => setValue(ev.target.value)}
                                value={value}
                                required
                            />
                        </td>
                    </tr>
                </table>
            </form>
        </ConfirmationModal>
    );
}
