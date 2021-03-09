import React, { useContext, useState } from "react";
import { useHistory } from "react-router";

import { faTrash } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction, ConfirmationModal } from "@mwdb-web/commons/ui";

export default function RemoveAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const history = useHistory();

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [disabledModalButton, setDisabledModalButton] = useState(false);

    async function deleteObject() {
        setDisabledModalButton(true);
        try {
            await api.removeObject(context.object.id);
            history.push(context.searchEndpoint);
        } catch (error) {
            setDisabledModalButton(false);
            setDeleteModalOpen(false);
            context.setObjectError(error);
        }
    }

    // If user can't remove objects: don't show the action
    if (!auth.hasCapability("removing_objects") || api.remote) return [];

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
