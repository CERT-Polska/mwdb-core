import { useContext } from "react";
import { useParams } from "react-router-dom";

import {
    ShowObject,
    ObjectTab,
    LatestConfigTab,
    RelationsTab,
    DownloadAction,
    ZipAction,
    FavoriteAction,
    PushAction,
    PullAction,
    UploadChildAction,
    RemoveAction,
} from "../ShowObject";

import {
    faFile,
    faFingerprint,
    faSearch,
} from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { SampleDetails } from "../SampleDetails";
import { SamplePreview } from "../SamplePreview";
import { PreviewSwitchAction } from "../PreviewSwitchAction";
import { ObjectOrConfigOrBlobData } from "@mwdb-web/types/types";
import { Extendable } from "@mwdb-web/commons/plugins";

export function ShowSampleView() {
    const api = useContext(APIContext);
    const params = useParams();
    const remotePath = useRemotePath();

    async function downloadSample(object?: Partial<ObjectOrConfigOrBlobData>) {
        if (object && object.id) {
            window.location.href = await api.requestFileDownloadLink(object.id);
        }
    }

    async function zipSample(object?: Partial<ObjectOrConfigOrBlobData>) {
        if (object && object.id) {
            window.location.href = await api.requestZipFileDownloadLink(
                object.id
            );
        }
    }

    return (
        <ShowObject
            ident="showSample"
            objectType="file"
            objectId={params.hash ?? ""}
            searchEndpoint={`${remotePath}/`}
            headerIcon={faFile}
            headerCaption="File details"
        >
            <Extendable ident="sampleTabs">
                <ObjectTab
                    tab="details"
                    icon={faFingerprint}
                    component={SampleDetails}
                    actions={[
                        <FavoriteAction />,
                        <DownloadAction download={downloadSample} />,
                        <ZipAction zip={zipSample} />,
                        <UploadChildAction />,
                        <PullAction />,
                        <PushAction />,
                        <RemoveAction />,
                    ]}
                />
                <RelationsTab />
                <ObjectTab
                    tab="preview"
                    icon={faSearch}
                    component={SamplePreview}
                    actions={[
                        <PreviewSwitchAction />,
                        <FavoriteAction />,
                        <DownloadAction download={downloadSample} />,
                        <UploadChildAction />,
                        <PullAction />,
                        <PushAction />,
                        <RemoveAction />,
                    ]}
                />
            </Extendable>
            <LatestConfigTab label="Static config" />
        </ShowObject>
    );
}
