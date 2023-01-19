import React, { useContext } from "react";

import { faArchive } from "@fortawesome/free-solid-svg-icons";

import { ObjectContext } from "../../../commons/context";
import { ObjectAction } from "../../../commons/ui";

export default function ZipAction(props) {
    const context = useContext(ObjectContext);

    async function zip() {
        try {
            await props.zip(context.object);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    return <ObjectAction label="Zip" icon={faArchive} action={zip} />;
}
