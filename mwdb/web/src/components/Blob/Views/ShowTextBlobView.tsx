import { useParams } from "react-router-dom";

import {
    ShowObject,
    ObjectTab,
    LatestConfigTab,
    RelationsTab,
    DownloadAction,
    FavoriteAction,
    RemoveAction,
    PushAction,
    PullAction,
} from "../../ShowObject";

import {
    faScroll,
    faFingerprint,
    faSearch,
} from "@fortawesome/free-solid-svg-icons";

import { downloadData } from "@mwdb-web/commons/helpers";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { TextBlobDetails } from "../common/TextBlobDetails";
import { TextBlobPreview } from "../common/TextBlobPreview";
import { BlobDiffAction } from "../common/BlobDiffAction";
import { ObjectOrConfigOrBlobData } from "@mwdb-web/types/types";
import { Extendable } from "@mwdb-web/commons/plugins";

export function ShowTextBlobView() {
    const params = useParams();
    const remotePath = useRemotePath();
    async function downloadTextBlob(
        object?: Partial<ObjectOrConfigOrBlobData>
    ) {
        if (object && "content" in object) {
            downloadData(object.content!, object.id!, "text/plain");
        }
    }

    return (
        <ShowObject
            ident="showTextBlob"
            objectType="blob"
            objectId={params.hash!}
            searchEndpoint={`${remotePath}/blobs`}
            headerIcon={faScroll}
            headerCaption="Blob details"
            defaultTab="preview"
        >
            <Extendable ident="blobTabs">
                <ObjectTab
                    tab="details"
                    icon={faFingerprint}
                    component={TextBlobDetails}
                    actions={[
                        <RemoveAction />,
                        <PushAction />,
                        <PullAction />,
                        <BlobDiffAction />,
                        <FavoriteAction />,
                        <DownloadAction download={downloadTextBlob} />,
                    ]}
                />
                <RelationsTab />
                <ObjectTab
                    tab="preview"
                    icon={faSearch}
                    component={TextBlobPreview}
                    actions={[
                        <RemoveAction />,
                        <PushAction />,
                        <PullAction />,
                        <BlobDiffAction />,
                        <FavoriteAction />,
                        <DownloadAction download={downloadTextBlob} />,
                    ]}
                />
            </Extendable>
            <LatestConfigTab label="Parsed blob" />
        </ShowObject>
    );
}
