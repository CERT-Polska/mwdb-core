import React, { useContext, useState } from "react";
import { connect } from "react-redux";

import { faGlobe } from '@fortawesome/free-solid-svg-icons'

import api from "@mwdb-web/commons/api";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from  "@mwdb-web/commons/ui";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

function PushAction(props) {
    const context = useContext(ObjectContext);
    const [isPushModalOpen, setPushModalOpen] = useState(false);
    const [remoteName, setRemoteName] = useState("");

    async function pushRemote() {
        let type = ({
            "file": "file",
            "static_config": "config",
            "text_blob": "blob"
        })[context.object.type]
        try {
            await api.pushObjectRemote(remoteName, type, context.object.id)
        } catch(error) {
            context.setObjectError(error);
        }
    }

    if(!props.remotes.length)
        return [];

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
                onConfirm={
                    (ev) => {
                        ev.preventDefault();
                        pushRemote();
                        setPushModalOpen(false);
                    }
                }
            >
                <form onSubmit={pushRemote}>
                    <select className="form-control" value={remoteName}
                            onChange={(e) => setRemoteName(e.currentTarget.value)}>
                        <option value="" hidden>Select the remote instance name</option>
                        {
                            props.remotes.sort().map(name =>
                                <option key={name} value={name}>{name}</option>
                            )
                        }
                    </select>
                </form>
            </ConfirmationModal>
        </React.Fragment>
    )
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        remotes: state.config.config["remotes"],
    }
}

export default connect(mapStateToProps)(PushAction);