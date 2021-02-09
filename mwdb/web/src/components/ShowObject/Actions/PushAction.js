import React, { useContext, useState } from "react";

import { faGlobe } from "@fortawesome/free-solid-svg-icons";

import api from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

export default function PushAction() {
    const config = useContext(ConfigContext);
    const context = useContext(ObjectContext);
    const [isPushModalOpen, setPushModalOpen] = useState(false);
    const [remoteName, setRemoteName] = useState("");

    async function pushRemote() {
        let type = {
            file: "file",
            static_config: "config",
            text_blob: "blob",
        }[context.object.type];
        try {
            await api.pushObjectRemote(remoteName, type, context.object.id);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    const remotes = config.config.remotes;

    if (!remotes || !remotes.length) return [];

    return (
        <React.Fragment>
            <ObjectAction
                label="Push"
                icon={faGlobe}
                action={() => setPushModalOpen(true)}
            />
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Push"
                message="Select remote where you want to push"
                isOpen={isPushModalOpen}
                onRequestClose={() => setPushModalOpen(false)}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    pushRemote();
                    setPushModalOpen(false);
                }}
            >
                <form onSubmit={pushRemote}>
                    <select
                        className="form-control"
                        value={remoteName}
                        onChange={(e) => setRemoteName(e.target.value)}
                    >
                        <option value="" hidden>
                            Select the remote instance name
                        </option>
                        {remotes.sort().map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </form>
            </ConfirmationModal>
        </React.Fragment>
    );
}
