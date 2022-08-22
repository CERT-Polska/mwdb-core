import React, { useState, useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";

import {
    ShowObject,
    ObjectTab,
    ObjectContext,
    useTabContext,
    LatestConfigTab,
    RelationsTab,
    DownloadAction,
    ZipAction,
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
import { useRemotePath } from "@mwdb-web/commons/remotes";

function SampleDetails() {
    const context = useContext(ObjectContext);
    const remotePath = useRemotePath();
    return (
        <DataTable>
            <Extendable ident="showSampleDetails">
                <tr className="flickerable">
                    <th>File name</th>
                    <td id="file_name">
                        <Link
                            to={makeSearchLink({
                                field: "name",
                                value: context.object.file_name,
                                pathname: `${remotePath}/`,
                            })}
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
                    <th>Variant file names</th>
                    <td id="variant_file_names">
                        {context.object.alt_names.map((alt_name) => (
                            <div>
                                <Link
                                    to={makeSearchLink({
                                        field: "name",
                                        value: alt_name,
                                        pathname: `${remotePath}/`,
                                    })}
                                >
                                    {alt_name}
                                </Link>
                                <span className="ml-2">
                                    <ActionCopyToClipboard
                                        text={alt_name}
                                        tooltipMessage="Copy file name to clipboard"
                                    />
                                </span>
                            </div>
                        ))}
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>File size</th>
                    <td id="file_size">
                        <Link
                            to={makeSearchLink({
                                field: "size",
                                value: context.object.file_size,
                                pathname: `${remotePath}/`,
                            })}
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
                            to={makeSearchLink({
                                field: "type",
                                value: context.object.file_type,
                                pathname: `${remotePath}/`,
                            })}
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
                            to={makeSearchLink({
                                field: "ssdeep",
                                value: context.object.ssdeep,
                                pathname: `${remotePath}/`,
                            })}
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
                                to={makeSearchDateLink({
                                    field: "upload_time",
                                    value: context.object.upload_time,
                                    pathname: `${remotePath}/`,
                                })}
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
                link={tabContext.getTabLink(tabContext.tab, "hex")}
            />
        );
    else
        return (
            <ObjectAction
                label="Raw view"
                link={tabContext.getTabLink(tabContext.tab, "raw")}
            />
        );
}

export default function ShowSample(props) {
    const api = useContext(APIContext);
    const params = useParams();
    const remotePath = useRemotePath();

    async function downloadSample(object) {
        window.location.href = await api.requestFileDownloadLink(object.id);
    }

    async function zipSample(object) {
        window.location.href = await api.requestZipFileDownloadLink(object.id);
    }

    return (
        <ShowObject
            ident="showSample"
            objectType="file"
            objectId={params.hash}
            searchEndpoint={`${remotePath}/`}
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
                    <ZipAction zip={zipSample} />,
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
