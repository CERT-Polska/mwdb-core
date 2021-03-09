import React, { useContext } from "react";
import { Link } from "react-router-dom";

import {
    ShowObject,
    ObjectTab,
    ObjectContext,
    LatestConfigTab,
    RelationsTab,
    DownloadAction,
    FavoriteAction,
    RemoveAction,
    ObjectAction,
    PushAction,
    PullAction,
} from "./ShowObject";

import {
    faScroll,
    faFingerprint,
    faRandom,
    faSearch,
} from "@fortawesome/free-solid-svg-icons";

import {
    makeSearchLink,
    makeSearchDateLink,
    downloadData,
    humanFileSize,
} from "@mwdb-web/commons/helpers";
import { DataTable, DateString, HexView } from "@mwdb-web/commons/ui";
import { Extendable } from "@mwdb-web/commons/extensions";
import { useRemote } from "@mwdb-web/commons/remotes";

function TextBlobDetails() {
    const context = useContext(ObjectContext);
    const remote = useRemote();
    const remotePath = remote ? `remote/${remote}/` : "";
    return (
        <DataTable>
            <Extendable ident="showTextBlobDetails">
                <tr>
                    <th>Blob name</th>
                    <td id="blob_name">
                        <Link
                            to={makeSearchLink(
                                "name",
                                context.object.blob_name,
                                false,
                                `${remotePath}/blobs`
                            )}
                        >
                            {context.object.blob_name}
                        </Link>
                    </td>
                </tr>
                <tr>
                    <th>Blob size</th>
                    <td id="blob_size">
                        <Link
                            to={makeSearchLink(
                                "size",
                                context.object.blob_size,
                                false,
                                `${remotePath}blobs`
                            )}
                        >
                            {humanFileSize(context.object.blob_size)}
                        </Link>
                    </td>
                </tr>
                <tr>
                    <th>Blob type</th>
                    <td id="blob_type">
                        <Link
                            to={makeSearchLink(
                                "type",
                                context.object.blob_type,
                                false,
                                `${remotePath}blobs`
                            )}
                        >
                            {context.object.blob_type}
                        </Link>
                    </td>
                </tr>
                <tr>
                    <th>First seen</th>
                    <td id="upload_time">
                        {" "}
                        {context.object.upload_time ? (
                            <Link
                                to={makeSearchDateLink(
                                    "upload_time",
                                    context.object.upload_time,
                                    `${remotePath}blobs`
                                )}
                            >
                                <DateString date={context.object.upload_time} />
                            </Link>
                        ) : (
                            []
                        )}
                    </td>
                </tr>
                <tr>
                    <th>Last seen</th>
                    <td id="last_seen">
                        {" "}
                        {context.object.last_seen ? (
                            <Link
                                to={makeSearchDateLink(
                                    "last_seen",
                                    context.object.last_seen,
                                    `${remotePath}blobs`
                                )}
                            >
                                <DateString date={context.object.last_seen} />
                            </Link>
                        ) : (
                            []
                        )}
                    </td>
                </tr>
            </Extendable>
        </DataTable>
    );
}

function TextBlobPreview() {
    const context = useContext(ObjectContext);
    return (
        <HexView content={context.object.content} mode="raw" showInvisibles />
    );
}

function BlobDiffAction() {
    const context = useContext(ObjectContext);
    const remote = useRemote();
    const remotePath = remote ? `/remote/${remote}` : "";
    return (
        <ObjectAction
            label="Diff with"
            icon={faRandom}
            link={`${remotePath}/blobs?diff=${context.object.id}`}
        />
    );
}

export default function ShowTextBlob(props) {
    async function downloadTextBlob(object) {
        downloadData(object.content, object.id, "text/plain");
    }

    return (
        <ShowObject
            ident="showTextBlob"
            objectType="blob"
            objectId={props.match.params.hash}
            searchEndpoint="/blobs"
            headerIcon={faScroll}
            headerCaption="Blob details"
            defaultTab="preview"
        >
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
            <LatestConfigTab label="Parsed blob" />
        </ShowObject>
    );
}
