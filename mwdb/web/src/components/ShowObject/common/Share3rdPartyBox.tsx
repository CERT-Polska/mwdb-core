import { useContext, useState } from "react";
import { toast } from "react-toastify";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { Extendable } from "@mwdb-web/commons/plugins";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { Capability } from "@mwdb-web/types/types";

type Props = {
    isEnabled: boolean;
    objectId: string;
};

export function Share3rdPartyBox(props: Props) {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const [isEnabled, setIsEnabled] = useState<boolean>(props.isEnabled);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    async function markObjectAsShareable() {
        try {
            await api.enableSharing3rdParty(props.objectId);
            setIsEnabled(true);
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    if (!auth.hasCapability(Capability.modify3rdPartySharing)) {
        return <></>;
    }

    return (
        <Extendable ident="share3rdPartyBox">
            <ConfirmationModal
                buttonStyle="btn-success"
                confirmText="Yes"
                message="Do you want to mark this object as shareable with 3rd parties?"
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                onConfirm={() => {
                    markObjectAsShareable();
                    setIsModalOpen(false);
                }}
            >
                Remember that this operation is irreversible
            </ConfirmationModal>
            <div className="card card-default">
                <div className="card-header">Third party sharing</div>
                <div className="card-body text">
                    {isEnabled ? (
                        "Sharing with third parties is enabled for this object"
                    ) : (
                        <>
                            Sharing with third parties is not enabled for this
                            object. Would you like to enable it? &nbsp;
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => setIsModalOpen(true)}
                            >
                                Yes
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Extendable>
    );
}
