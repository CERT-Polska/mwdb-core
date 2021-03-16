import React, { useContext, useState } from "react";
import { useHistory, useRouteMatch } from "react-router";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api/context";
import { ConfigContext } from "@mwdb-web/commons/config";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { mapObjectType } from "@mwdb-web/commons/helpers";

export default function PushAction() {
    const api = useContext(APIContext);
    const config = useContext(ConfigContext);
    const context = useContext(ObjectContext);
    const history = useHistory();
    const match = useRouteMatch("/:type/:id");
    const [isPushModalDisabled, setPushModalDisabled] = useState(false);
    const [isPushModalOpen, setPushModalOpen] = useState(false);
    const [remoteName, setRemoteName] = useState("");

    const remotes = config.config.remotes;

    if (!remotes || !remotes.length || api.remote) return [];

    async function pushRemote() {
        let type = mapObjectType(context.object.type);
        try {
            setPushModalDisabled(true);
            await api.pushObjectRemote(remoteName, type, context.object.id);
            history.push(
                `/remote/${remoteName}/${match.params.type}/${match.params.id}`
            );
        } catch (error) {
            context.setObjectError(error);
            setPushModalOpen(false);
        }
    }

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
                disabled={isPushModalDisabled}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    pushRemote();
                }}
            >
                <form onSubmit={pushRemote}>
                    <select
                        className="form-control"
                        value={remoteName}
                        disabled={isPushModalDisabled}
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
