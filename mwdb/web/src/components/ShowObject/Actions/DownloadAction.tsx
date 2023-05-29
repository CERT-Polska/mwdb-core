import { useContext } from "react";

import { faDownload } from "@fortawesome/free-solid-svg-icons";

import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction } from "@mwdb-web/commons/ui";
import { ObjectOrConfigOrBlobData } from "@mwdb-web/types/types";

type Props = {
    download: (object?: Partial<ObjectOrConfigOrBlobData>) => Promise<void>;
};

export function DownloadAction(props: Props) {
    const context = useContext(ObjectContext);

    async function download() {
        try {
            await props.download(context.object);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    return (
        <ObjectAction label="Download" icon={faDownload} action={download} />
    );
}
