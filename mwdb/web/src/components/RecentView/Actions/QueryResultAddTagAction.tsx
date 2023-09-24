import { useContext, useState } from "react";

import { faTag } from "@fortawesome/free-solid-svg-icons";

import { Capability, ObjectData } from "@mwdb-web/types/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { QueryContext } from "../common/QueryContext";
import { APIContext } from "@mwdb-web/commons/api";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { AuthContext } from "@mwdb-web/commons/auth";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { ResultOptionItem } from "../common/ResultOptionItem";

export function AddTagAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const { items } = useContext(QueryContext);

    const { setAlert } = useViewAlert();

    const [tag, setTag] = useState<string>("");
    const [modalOpen, setIsModalOpen] = useState<boolean>(false);


    function addTag() {
        items.forEach(async (e: ObjectData) => {
            await api.addObjectTag(e.id, tag)
                .catch((err) => setAlert({ error: `Error adding tag to object ${e.id}: ${err}` }))
        });
        setIsModalOpen(false);
    }

    return (
        <>
            {auth.hasCapability(Capability.addingTags) ? (
                <ResultOptionItem
                    key={"tagOption"}
                    title={"Add Tag to Results"}
                    action={() => setIsModalOpen(true)}
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
                        <div className="input-group">
                            <input
                                className="form-control small"
                                onChange={(e) => setTag(e.target.value)}
                            />
                        </div>
                    </ConfirmationModal>
                </ResultOptionItem>
            ) : []}
        </>
    );
}
