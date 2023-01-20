import React, { useContext } from "react";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { APIContext } from "../../../commons/api";
import { AuthContext, Capability } from "../../../commons/auth";
import { ObjectContext } from "../../../commons/context";
import { ObjectAction } from "../../../commons/ui";

export default function RemoveAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    // If user can't add parents: don't show the action
    if (
        !auth.hasCapability(Capability.addingParents) ||
        !auth.hasCapability(Capability.addingFiles) ||
        api.remote
    )
        return [];

    return (
        <ObjectAction
            label="Upload child"
            icon={faPlus}
            link={`/upload?parent=${context.object.id}`}
        />
    );
}
