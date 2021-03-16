import React, { useContext } from "react";

import {
    faFingerprint,
    faSearch,
    faTable,
} from "@fortawesome/free-solid-svg-icons";

import ConfigTable from "./ConfigTable";
import {
    ShowObject,
    ObjectTab,
    ObjectContext,
    RelationsTab,
    DownloadAction,
    FavoriteAction,
    RemoveAction,
    PushAction,
    PullAction,
} from "./ShowObject";

import { downloadData } from "@mwdb-web/commons/helpers";
import { HexView } from "@mwdb-web/commons/ui";

function ConfigDetails() {
    const context = useContext(ObjectContext);
    return <ConfigTable object={context.object} />;
}

function ConfigPreview() {
    const context = useContext(ObjectContext);
    return (
        <HexView
            content={JSON.stringify(context.object.cfg, null, 4)}
            mode="raw"
            json
        />
    );
}

export default function ShowConfig(props) {
    async function downloadTextBlob(object) {
        downloadData(JSON.stringify(object.cfg), object.id, "application/json");
    }

    return (
        <ShowObject
            ident="showConfig"
            objectType="config"
            objectId={props.match.params.hash}
            searchEndpoint="/configs"
            headerIcon={faTable}
            headerCaption="Config details"
        >
            <ObjectTab
                tab="details"
                icon={faFingerprint}
                component={ConfigDetails}
                actions={[
                    <RemoveAction />,
                    <PushAction />,
                    <PullAction />,
                    <FavoriteAction />,
                    <DownloadAction download={downloadTextBlob} />,
                ]}
            />
            <RelationsTab />
            <ObjectTab
                tab="preview"
                icon={faSearch}
                component={ConfigPreview}
                actions={[
                    <RemoveAction />,
                    <PushAction />,
                    <PullAction />,
                    <FavoriteAction />,
                    <DownloadAction download={downloadTextBlob} />,
                ]}
            />
        </ShowObject>
    );
}
