import { APIContext } from "@mwdb-web/commons/api";
import { useContext, useEffect, useState } from "react";
import { ObjectContext, useTabContext } from "./ShowObject";
import { negateBuffer } from "@mwdb-web/commons/helpers";
import { HexView } from "@mwdb-web/commons/ui";

export function SamplePreview() {
    const [content, setContent] = useState<ArrayBuffer>(new ArrayBuffer(0));
    const api = useContext(APIContext);
    const objectContext = useContext(ObjectContext);
    const tabContext = useTabContext();

    async function updateSample() {
        try {
            const fileId = objectContext!.object!.id!;
            const obfuscate = 1;
            const fileContentResponse = await api.downloadFile(
                fileId,
                obfuscate
            );
            const fileContentResponseData = negateBuffer(
                fileContentResponse.data
            );
            setContent(fileContentResponseData);
        } catch (e) {
            objectContext.setObjectError(e);
        }
    }

    useEffect(() => {
        updateSample();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objectContext?.object?.id]);

    return (
        <HexView
            content={content}
            mode={tabContext.subTab || "raw"}
            showInvisibles
        />
    );
}
