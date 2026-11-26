import { useParams } from "react-router-dom";

import {
    faFingerprint,
    faSearch,
    faTable,
} from "@fortawesome/free-solid-svg-icons";

import {
    ShowObject,
    ObjectTab,
    RelationsTab,
    DownloadAction,
    FavoriteAction,
    RemoveAction,
} from "../../ShowObject";

import { downloadData } from "@mwdb-web/commons/helpers";
import { ConfigDetails } from "../common/ConfigDetails";
import { ConfigPreview } from "../common/ConfigPreview";
import { ObjectOrConfigOrBlobData } from "@mwdb-web/types/types";
import { Extendable } from "@mwdb-web/commons/plugins";

export function ShowConfigView() {
    const params = useParams();
    async function downloadTextBlob(
        object?: Partial<ObjectOrConfigOrBlobData>
    ) {
        if (object && "cfg" in object && object.id) {
            downloadData(
                JSON.stringify(object.cfg),
                object.id,
                "application/json"
            );
        }
    }

    return (
        <ShowObject
            ident="showConfig"
            objectType="config"
            objectId={params.hash ?? ""}
            searchEndpoint={"/configs"}
            headerIcon={faTable}
            headerCaption="Config details"
        >
            <Extendable ident="configTabs">
                <ObjectTab
                    tab="details"
                    icon={faFingerprint}
                    component={ConfigDetails}
                    actions={[
                        <FavoriteAction />,
                        <DownloadAction download={downloadTextBlob} />,
                        <RemoveAction />,
                    ]}
                />
                <RelationsTab />
                <ObjectTab
                    tab="preview"
                    icon={faSearch}
                    component={ConfigPreview}
                    actions={[
                        <FavoriteAction />,
                        <DownloadAction download={downloadTextBlob} />,
                        <RemoveAction />,
                    ]}
                />
            </Extendable>
        </ShowObject>
    );
}
