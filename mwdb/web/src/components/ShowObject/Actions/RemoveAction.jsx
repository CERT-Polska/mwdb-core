import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { faTrash } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "../../../commons/api";
import { AuthContext, Capability } from "../../../commons/auth";
import { ObjectContext } from "../../../commons/context";
import { ObjectAction, ConfirmationModal } from "../../../commons/ui";

export default function RemoveAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const navigate = useNavigate();

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [disabledModalButton, setDisabledModalButton] = useState(false);

    async function deleteObject() {
        setDisabledModalButton(true);
        try {
            await api.removeObject(context.object.id);
            navigate(context.searchEndpoint);
        } catch (error) {
            setDisabledModalButton(false);
            setDeleteModalOpen(false);
            context.setObjectError(error);
        }
    }

    // If user can't remove objects: don't show the action
    if (!auth.hasCapability(Capability.removingObjects) || api.remote)
        return [];

    return (
        <React.Fragment>
            <ObjectAction
                label="Remove"
                icon={faTrash}
                action={() => setDeleteModalOpen(true)}
            />
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Yes"
                message="Are you sure you want to delete this object?"
                isOpen={isDeleteModalOpen}
                disabled={disabledModalButton}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    deleteObject();
                }}
            />
        </React.Fragment>
    );
}
