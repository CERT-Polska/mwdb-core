import React, { useContext } from "react";
import { connect } from "react-redux";

import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";


function RemoveAction(props) {
    const context = useContext(ObjectContext);

    // If user can't add parents: don't show the action
    if(!props.canAddParent)
        return [];

    return (
        <ObjectAction
            label="Upload child"
            icon={faPlus}
            link={`/upload?parent=${context.object.id}`}
        />
    )
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        canAddParent: state.auth.loggedUser.capabilities.includes("adding_parents")
    }
}

export default connect(mapStateToProps)(RemoveAction);