import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectPreview } from "@mwdb-web/commons/ui";
import { BlobData } from "@mwdb-web/types/types";
import { useContext } from "react";

export function TextBlobPreview() {
    const context = useContext(ObjectContext);

    if (!context) {
        return <></>;
    }

    const object = context.object as BlobData;

    return <ObjectPreview content={object.content} mode="raw" showInvisibles />;
}
