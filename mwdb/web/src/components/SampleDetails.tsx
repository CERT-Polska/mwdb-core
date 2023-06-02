import { useContext } from "react";
import { Link } from "react-router-dom";

import { ObjectContext } from "./ShowObject";

import {
    makeSearchLink,
    makeSearchDateLink,
    humanFileSize,
} from "@mwdb-web/commons/helpers";
import { Extendable } from "@mwdb-web/commons/plugins";
import {
    ActionCopyToClipboard,
    DataTable,
    DateString,
    Hash,
} from "@mwdb-web/commons/ui";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { ObjectData } from "@mwdb-web/types/types";

export function SampleDetails() {
    const context = useContext(ObjectContext);
    const remotePath = useRemotePath();

    if (!context) {
        return <></>;
    }

    const object = context.object as ObjectData;

    return (
        <DataTable>
            <Extendable ident="showSampleDetails">
                <tr className="flickerable">
                    <th>File name</th>
                    <td id="file_name">
                        <Link
                            to={makeSearchLink({
                                field: "name",
                                value: object.file_name,
                                pathname: `${remotePath}/`,
                            })}
                        >
                            {object.file_name}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.file_name}
                                tooltipMessage="Copy file name to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>Variant file names</th>
                    <td id="variant_file_names">
                        {object.alt_names.map((alt_name) => (
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
                                value: object.file_size.toString(),
                                pathname: `${remotePath}/`,
                            })}
                        >
                            {humanFileSize(object.file_size)}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.file_size.toString()}
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
                                value: object.file_type,
                                pathname: `${remotePath}/`,
                            })}
                        >
                            {object.file_type}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.file_type}
                                tooltipMessage="Copy file type to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>md5</th>
                    <td id="md5">
                        <Hash hash={object.md5} inline />
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.md5}
                                tooltipMessage="Copy md5 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha1</th>
                    <td id="sha1">
                        <Hash hash={object.sha1} inline />
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.sha1}
                                tooltipMessage="Copy sha1 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha256</th>
                    <td id="sha256">
                        <Hash hash={object.sha256} inline />
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.sha256}
                                tooltipMessage="Copy sha256 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha512</th>
                    <td id="sha512">
                        <Hash hash={object.sha512} inline />
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.sha512}
                                tooltipMessage="Copy sha512 to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>crc32</th>
                    <td id="crc32" className="text-monospace">
                        {object.crc32}
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.crc32}
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
                                value: object.ssdeep,
                                pathname: `${remotePath}/`,
                            })}
                        >
                            {object.ssdeep}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={object.ssdeep}
                                tooltipMessage="Copy ssdeep to clipboard"
                            />
                        </span>
                    </td>
                </tr>
                <tr>
                    <th>Upload time</th>
                    <td id="upload_time">
                        {" "}
                        {object.upload_time ? (
                            <Link
                                to={makeSearchDateLink({
                                    field: "upload_time",
                                    value: object.upload_time,
                                    pathname: `${remotePath}/`,
                                })}
                            >
                                <DateString date={object.upload_time} />
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
