import { ObjectContext } from "@mwdb-web/commons/context";
import { HexView } from "@mwdb-web/commons/ui";
import { BlobData } from "@mwdb-web/types/types";
import { useContext } from "react";

export function TextBlobPreview() {
    const context = useContext(ObjectContext);

    if (!context) {
        return <></>;
    }

    const object = context.object as BlobData;

    return <HexView content={object.content} mode="raw" showInvisibles />;
}
