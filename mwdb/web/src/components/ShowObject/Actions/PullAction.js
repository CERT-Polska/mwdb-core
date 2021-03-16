import React, { useContext, useState } from "react";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api/context";
import { ConfigContext } from "@mwdb-web/commons/config";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { mapObjectType } from "@mwdb-web/commons/helpers";

export default function PullAction() {
    const api = useContext(APIContext);
    const config = useContext(ConfigContext);
    const context = useContext(ObjectContext);
    const [isPullModalOpen, setPullModalOpen] = useState(false);

    async function pullRemote() {
        let type = mapObjectType(context.object.type);
        try {
            await api.pullObjectRemote(api.remote, type, context.object.id);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    const remotes = config.config.remotes;

    if (!remotes.length || !api.remote) return [];
    return (
        <React.Fragment>
            <ObjectAction
                label="Pull"
                icon={faGlobe}
                action={() => setPullModalOpen(true)}
            />
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Pull"
                message="Are you sure you want to pull this object for local instance?"
                isOpen={isPullModalOpen}
                onRequestClose={() => setPullModalOpen(false)}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    pullRemote();
                    setPullModalOpen(false);
                }}
            />
        </React.Fragment>
    );
}
