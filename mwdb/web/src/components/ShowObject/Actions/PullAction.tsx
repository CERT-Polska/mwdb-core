import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { mapObjectType } from "@mwdb-web/commons/helpers";

export function PullAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const navigate = useNavigate();
    const [shareMode, setShareMode] = useState<string>("*");
    const [group, setGroup] = useState<string>("");
    const [isPullModalOpen, setPullModalOpen] = useState<boolean>(false);
    const [isPullModalDisabled, setPullModalDisabled] =
        useState<boolean>(false);

    if (!api.remote) return <></>;

    async function pullRemote() {
        const type = mapObjectType(context.object!.type!) as
            | "file"
            | "static_config"
            | "text_blob";
        const upload_as = shareMode === "single" ? group : shareMode;
        try {
            setPullModalDisabled(true);
            await api.pullObjectRemote(
                api.remote!,
                type,
                context.object!.id!,
                upload_as
            );
            navigate(`/${type}/${context.object!.id!}`);
        } catch (error) {
            context.setObjectError(error);
            setPullModalOpen(false);
        }
    }

    const remoteForm = React.createRef<HTMLFormElement>();

    function handleSubmit(event: React.MouseEvent) {
        event.preventDefault();
        if (!remoteForm.current || !remoteForm.current.reportValidity()) return;
        pullRemote();
    }

    const groups = auth.user.groups
        .filter(
            (name) => !["everything", "public", auth.user.login].includes(name)
        )
        .sort()
        .map((name) => <option value={name}>{name}</option>);

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
                message="Pull remote object"
                isOpen={isPullModalOpen}
                onRequestClose={() => {
                    setPullModalOpen(false);
                    setShareMode("");
                }}
                disabled={isPullModalDisabled}
                onConfirm={(ev) => {
                    handleSubmit(ev);
                }}
            >
                <form onSubmit={pullRemote} ref={remoteForm}>
                    <div className="form-group">
                        <label>Share with</label>
                        <select
                            className="form-control"
                            value={shareMode}
                            disabled={isPullModalDisabled}
                            onChange={(e) => setShareMode(e.target.value)}
                            required
                        >
                            <option value="*">All my groups</option>
                            <option value="single">Single group...</option>
                            <option value="public">Everybody</option>
                            <option value="private">Only me</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Group name</label>
                        <select
                            className="form-control"
                            value={group}
                            disabled={
                                isPullModalDisabled || shareMode !== "single"
                            }
                            onChange={(e) => setGroup(e.target.value)}
                            required
                        >
                            <option value="" hidden />
                            {groups}
                        </select>
                    </div>
                </form>
            </ConfirmationModal>
        </React.Fragment>
    );
}
