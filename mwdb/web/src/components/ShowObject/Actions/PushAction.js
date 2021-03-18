import React, { useContext, useState } from "react";
import { useHistory } from "react-router";
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
    const [isPushModalDisabled, setPushModalDisabled] = useState(false);
    const [isPushModalOpen, setPushModalOpen] = useState(false);
    const [remoteName, setRemoteName] = useState("");
    const [shareMode, setShareMode] = useState("*");

    const remotes = config.config.remotes;

    if (!remotes || !remotes.length || api.remote) return [];

    async function pushRemote() {
        let type = mapObjectType(context.object.type);
        try {
            setPushModalDisabled(true);
            await api.pushObjectRemote(
                remoteName,
                type,
                context.object.id,
                shareMode
            );
            history.push(`/remote/${remoteName}/${type}/${context.object.id}`);
        } catch (error) {
            context.setObjectError(error);
            setPushModalOpen(false);
        }
    }

    const remoteForm = React.createRef();

    function handleSubmit(event) {
        event.preventDefault();
        if (!remoteForm.current || !remoteForm.current.reportValidity()) return;
        pushRemote();
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
                message="Push object remote"
                isOpen={isPushModalOpen}
                onRequestClose={() => {
                    setPushModalOpen(false);
                    setRemoteName("");
                    setShareMode("");
                }}
                disabled={isPushModalDisabled}
                onConfirm={(ev) => {
                    handleSubmit(ev);
                }}
            >
                <form onSubmit={pushRemote} ref={remoteForm}>
                    <div className="form-group">
                        <label>Remote instance</label>
                        <select
                            className="form-control"
                            value={remoteName}
                            disabled={isPushModalDisabled}
                            onChange={(e) => setRemoteName(e.target.value)}
                            required
                        >
                            <option value="" hidden>
                                Select the remote name
                            </option>
                            {remotes.sort().map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Share with</label>
                        <select
                            className="form-control"
                            value={shareMode}
                            disabled={isPushModalDisabled}
                            onChange={(e) => setShareMode(e.target.value)}
                            required
                        >
                            <option value="*">All my groups</option>
                            <option value="public">Everybody</option>
                            <option value="private">Only me</option>
                        </select>
                    </div>
                </form>
            </ConfirmationModal>
        </React.Fragment>
    );
}
