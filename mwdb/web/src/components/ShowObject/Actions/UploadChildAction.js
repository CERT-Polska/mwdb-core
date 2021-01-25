import React, { useContext } from "react";

import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";


export default function RemoveAction() {
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    // If user can't add parents: don't show the action
    if(!auth.hasCapability("adding_parents"))
        return [];

    return (
        <ObjectAction
            label="Upload child"
            icon={faPlus}
            link={`/upload?parent=${context.object.id}`}
        />
    )
}
