import { useContext, useState } from "react";

import { faTrash } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction, ConfirmationModal } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { Capability } from "@mwdb-web/types/types";

export function RemoveAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const { redirectToAlert } = useViewAlert();

    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [disabledModalButton, setDisabledModalButton] =
        useState<boolean>(false);

    async function deleteObject() {
        setDisabledModalButton(true);
        try {
            await api.removeObject(context.object!.id!);
            redirectToAlert({
                target: context.searchEndpoint,
                success: "Object was successfully removed",
            });
        } catch (error) {
            setDisabledModalButton(false);
            setDeleteModalOpen(false);
            context.setObjectError(error);
        }
    }

    // If user can't remove objects: don't show the action
    if (!auth.hasCapability(Capability.removingObjects) || api.remote)
        return <></>;

    return (
        <>
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
        </>
    );
}
