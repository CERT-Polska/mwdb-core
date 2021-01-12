import React, { useContext, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from 'react-router';

import { faTrash } from '@fortawesome/free-solid-svg-icons'

import api from "@mwdb-web/commons/api";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction, ConfirmationModal } from "@mwdb-web/commons/ui";


function RemoveAction(props) {
    const context = useContext(ObjectContext);
    const history = useHistory();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [disabledModalButton, setDisabledModalButton] = useState(false);

    async function deleteObject() {
        setDisabledModalButton(true);
        try {
            await api.removeObject(context.object.id)
            history.push(context.searchEndpoint);
        } catch(error) {
            setDisabledModalButton(false);
            setDeleteModalOpen(false);
            context.setObjectError(error);
        }
    }

    // If user can't remove objects: don't show the action
    if(!props.canDeleteObject)
        return [];

    return (
        <React.Fragment>
            <ObjectAction 
                label="Remove"
                icon={faTrash}
                action={() => setDeleteModalOpen(true)}
            />
            <ConfirmationModal 
                buttonStyle="badge-success"
                confirmText="Yes"
                message="Are you sure you want to delete this object?"
                isOpen={isDeleteModalOpen}
                disabled={disabledModalButton}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={
                    (ev) => {
                        ev.preventDefault();
                        deleteObject();
                    }
                }
            />
        </React.Fragment>
    )
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        canDeleteObject: state.auth.loggedUser.capabilities.includes("removing_objects"),
    }
}

export default connect(mapStateToProps)(RemoveAction);
