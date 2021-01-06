import React, { useContext } from "react";
import { connect } from "react-redux";

import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { ObjectAction } from "./ObjectTab";

import { ObjectContext } from "@mwdb-web/commons/context";


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