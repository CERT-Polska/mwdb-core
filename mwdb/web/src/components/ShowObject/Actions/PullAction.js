import React, { useContext, useState } from "react";
import { useHistory, useRouteMatch } from "react-router";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api/context";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

export default function PullAction() {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);
    const history = useHistory();
    const match = useRouteMatch("/remote/:remote/:type/:id");
    const [isPullModalOpen, setPullModalOpen] = useState(false);
    const [isPullModalDisabled, setPullModalDisabled] = useState(false);

    if (!api.remote) return [];

    async function pullRemote() {
        let type = {
            file: "file",
            static_config: "config",
            text_blob: "blob",
        }[context.object.type];
        try {
            setPullModalDisabled(true);
            await api.pullObjectRemote(api.remote, type, context.object.id);
            history.push(`/${match.params.type}/${match.params.id}`);
        } catch (error) {
            context.setObjectError(error);
            setPullModalOpen(false);
        }
    }

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
                disabled={isPullModalDisabled}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    pullRemote();
                }}
            />
        </React.Fragment>
    );
}
