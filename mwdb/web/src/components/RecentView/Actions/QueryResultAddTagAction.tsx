import { useContext, useState } from "react";

import { Capability, ObjectData } from "@mwdb-web/types/types";
import { QueryResultContext } from "../common/QueryResultContext";
import { APIContext } from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { AuthContext } from "@mwdb-web/commons/auth";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { ResultOptionItem } from "../common/ResultOptionItem";

export function AddTagAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const { items } = useContext(QueryResultContext);

    const { setAlert } = useViewAlert();

    const [tag, setTag] = useState<string>("");
    const [modalOpen, setIsModalOpen] = useState<boolean>(false);


    function addTag() {
        items.forEach(async (e: ObjectData) => {
            await api.addObjectTag(e.id, tag)
                .catch((err) => setAlert({ 
                    error: `Error adding tag to object ${e.id}: ${err}` 
            }));
        });
        setIsModalOpen(false);
    }

    return (
            <ResultOptionItem
                key={"tagOption"}
                title={"Add Tag"}
                action={() => setIsModalOpen(true)}
                authenticated={() => auth.hasCapability(Capability.addingTags)}
            >
                <ConfirmationModal
                    isOpen={modalOpen}
                    confirmText="Ok"
                    cancelText="Cancel"
                    message="Please enter a tag to add"
                    onRequestClose={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                    onConfirm={addTag}
                >
                    <input
                        className="form-control small"
                        onChange={(e) => setTag(e.target.value)}
                    />
                </ConfirmationModal>
            </ResultOptionItem>
    );
}
