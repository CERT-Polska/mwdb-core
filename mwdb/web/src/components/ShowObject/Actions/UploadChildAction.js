import React, { useContext } from "react";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";

export default function RemoveAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    // If user can't add parents: don't show the action
    if (!auth.hasCapability("adding_parents") || api.remote) return [];

    return (
        <ObjectAction
            label="Upload child"
            icon={faPlus}
            link={`/upload?parent=${context.object.id}`}
        />
    );
}
