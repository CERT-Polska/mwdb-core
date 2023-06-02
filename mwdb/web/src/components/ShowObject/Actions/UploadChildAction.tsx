import { useContext } from "react";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { Capability } from "@mwdb-web/types/types";

export function UploadChildAction() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    // If user can't add parents: don't show the action
    if (
        !auth.hasCapability(Capability.addingParents) ||
        !auth.hasCapability(Capability.addingFiles) ||
        api.remote
    )
        return <></>;

    return (
        <ObjectAction
            label="Upload child"
            icon={faPlus}
            link={`/upload?parent=${context.object!.id}`}
        />
    );
}
