import { faRandom } from "@fortawesome/free-solid-svg-icons";
import { ObjectContext } from "@mwdb-web/commons/context";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { BlobData } from "@mwdb-web/types/types";
import { useContext } from "react";

export function BlobDiffAction() {
    const context = useContext(ObjectContext);
    const remotePath = useRemotePath();

    if (!context) {
        return <></>;
    }

    const object = context.object as BlobData;

    return (
        <ObjectAction
            label="Diff with"
            icon={faRandom}
            link={`${remotePath}/blobs?diff=${object.id}`}
        />
    );
}
