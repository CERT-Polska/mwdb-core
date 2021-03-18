import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";

import {
    ShowObject,
    ObjectTab,
    ObjectContext,
    useTabContext,
    LatestConfigTab,
    RelationsTab,
    DownloadAction,
    FavoriteAction,
    PushAction,
    PullAction,
    UploadChildAction,
    RemoveAction,
    ObjectAction,
} from "./ShowObject";

import {
    faFile,
    faFingerprint,
    faSearch,
} from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api/context";
import {
    makeSearchLink,
    makeSearchDateLink,
    humanFileSize,
} from "@mwdb-web/commons/helpers";
import { Extendable } from "@mwdb-web/commons/extensions";
import {
    ActionCopyToClipboard,
    DataTable,
    DateString,
    Hash,
    HexView,
} from "@mwdb-web/commons/ui";
import { useRemote } from "@mwdb-web/commons/remotes";

function SampleDetails() {
    const context = useContext(ObjectContext);
    const remote = useRemote();
    const remotePath = remote ? `remote/${remote}` : "";
    return (
        <DataTable>
            <Extendable ident="showSampleDetails">
                <tr className="flickerable">
                    <th>File name</th>
                    <td id="file_name">
                        <Link
                            to={makeSearchLink(
                                "name",
                                context.object.file_name,
                                false,
                                remotePath
                            )}
                        >
                            {context.object.file_name}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.file_name}
                                tooltipMessage="Copy file name to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>File size</th>
                    <td id="file_size">
                        <Link
                            to={makeSearchLink(
                                "size",
                                context.object.file_size,
                                false,
                                remotePath
                            )}
                        >
                            {humanFileSize(context.object.file_size)}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.file_size}
                                tooltipMessage="Copy file size to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>File type</th>
                    <td id="file_type">
                        <Link
                            to={makeSearchLink(
                                "type",
                                context.object.file_type,
                                false,
                                remotePath
                            )}
                        >
                            {context.object.file_type}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.file_type}
                                tooltipMessage="Copy file type to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>md5</th>
                    <td id="md5">
                        <Hash hash={context.object.md5} inline />
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.md5}
                                tooltipMessage="Copy md5 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha1</th>
                    <td id="sha1">
                        <Hash hash={context.object.sha1} inline />
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.sha1}
                                tooltipMessage="Copy sha1 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha256</th>
                    <td id="sha256">
                        <Hash hash={context.object.sha256} inline />
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.sha256}
                                tooltipMessage="Copy sha256 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha512</th>
                    <td id="sha512">
                        <Hash hash={context.object.sha512} inline />
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.sha512}
                                tooltipMessage="Copy sha512 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>crc32</th>
                    <td id="crc32" className="text-monospace">
                        {context.object.crc32}
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.crc32}
                                tooltipMessage="Copy crc32 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>ssdeep</th>
                    <td id="ssdeep" className="text-monospace">
                        <Link
                            to={makeSearchLink(
                                "ssdeep",
                                context.object.ssdeep,
                                false,
                                remotePath
                            )}
                        >
                            {context.object.ssdeep}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={context.object.ssdeep}
                                tooltipMessage="Copy ssdeep to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr>
                    <th>Upload time</th>
                    <td id="upload_time">
                        {" "}
                        {context.object.upload_time ? (
                            <Link
                                to={makeSearchDateLink(
                                    "upload_time",
                                    context.object.upload_time,
                                    remotePath
                                )}
                            >
                                <DateString date={context.object.upload_time} />
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

function SamplePreview() {
    const [content, setContent] = useState("");
    const api = useContext(APIContext);
    const objectContext = useContext(ObjectContext);
    const tabContext = useTabContext();

    async function updateSample() {
        try {
            const fileId = objectContext.object.id;
            const fileContentResponse = await api.downloadFile(fileId);
            setContent(fileContentResponse.data);
        } catch (e) {
            objectContext.setObjectError(e);
        }
    }

    useEffect(() => {
        updateSample();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objectContext.object.id]);

    return (
        <HexView
            content={content}
            mode={tabContext.subTab || "raw"}
            showInvisibles
        />
    );
}

function PreviewSwitchAction(props) {
    const tabContext = useTabContext();
    const mode = tabContext.subTab || "raw";

    if (mode === "raw")
        return (
            <ObjectAction
                label="Hex view"
                link={() => tabContext.getTabLink(tabContext.tab, "hex")}
            />
        );
    else
        return (
            <ObjectAction
                label="Raw view"
                link={() => tabContext.getTabLink(tabContext.tab, "raw")}
            />
        );
}

export default function ShowSample(props) {
    const api = useContext(APIContext);
    async function downloadSample(object) {
        window.location.href = await api.requestFileDownloadLink(object.id);
    }

    return (
        <ShowObject
            ident="showSample"
            objectType="file"
            objectId={props.match.params.hash}
            searchEndpoint=""
            headerIcon={faFile}
            headerCaption="File details"
        >
            <ObjectTab
                tab="details"
                icon={faFingerprint}
                component={SampleDetails}
                actions={[
                    <RemoveAction />,
                    <PushAction />,
                    <PullAction />,
                    <UploadChildAction />,
                    <FavoriteAction />,
                    <DownloadAction download={downloadSample} />,
                ]}
            />
            <RelationsTab />
            <ObjectTab
                tab="preview"
                icon={faSearch}
                component={SamplePreview}
                actions={[
                    <PreviewSwitchAction />,
                    <RemoveAction />,
                    <PushAction />,
                    <PullAction />,
                    <UploadChildAction />,
                    <FavoriteAction />,
                    <DownloadAction download={downloadSample} />,
                ]}
            />
            <LatestConfigTab label="Static config" />
        </ShowObject>
    );
}
