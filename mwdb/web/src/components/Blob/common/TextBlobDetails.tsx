import { useContext } from "react";
import { Link } from "react-router-dom";

import { ObjectContext } from "../../ShowObject";

import {
    makeSearchLink,
    makeSearchDateLink,
    humanFileSize,
} from "@mwdb-web/commons/helpers";
import { DataTable, DateString } from "@mwdb-web/commons/ui";
import { Extendable } from "@mwdb-web/commons/plugins";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { BlobData } from "@mwdb-web/types/types";

export function TextBlobDetails() {
    const context = useContext(ObjectContext);
    const remotePath = useRemotePath();

    if (!context) {
        return <></>;
    }

    const object = context.object as BlobData;

    return (
        <DataTable>
            <Extendable ident="showTextBlobDetails">
                <tr>
                    <th>Blob name</th>
                    <td id="blob_name">
                        <Link
                            to={makeSearchLink({
                                field: "name",
                                value: object.blob_name,
                                pathname: `${remotePath}/blobs`,
                            })}
                        >
                            {object.blob_name}
                        </Link>
                    </td>
                </tr>
                <tr>
                    <th>Blob size</th>
                    <td id="blob_size">
                        <Link
                            to={makeSearchLink({
                                field: "size",
                                value: object.blob_size.toString(),
                                pathname: `${remotePath}/blobs`,
                            })}
                        >
                            {humanFileSize(object.blob_size)}
                        </Link>
                    </td>
                </tr>
                <tr>
                    <th>Blob type</th>
                    <td id="blob_type">
                        <Link
                            to={makeSearchLink({
                                field: "type",
                                value: object.blob_type,
                                pathname: `${remotePath}/blobs`,
                            })}
                        >
                            {object.blob_type}
                        </Link>
                    </td>
                </tr>
                <tr>
                    <th>First seen</th>
                    <td id="upload_time">
                        {" "}
                        {object.upload_time ? (
                            <Link
                                to={makeSearchDateLink({
                                    field: "upload_time",
                                    value: object.upload_time,
                                    pathname: `${remotePath}/blobs`,
                                })}
                            >
                                <DateString date={object.upload_time} />
                            </Link>
                        ) : (
                            <></>
                        )}
                    </td>
                </tr>
                <tr>
                    <th>Last seen</th>
                    <td id="last_seen">
                        {" "}
                        {object.last_seen ? (
                            <Link
                                to={makeSearchDateLink({
                                    field: "last_seen",
                                    value: object.last_seen,
                                    pathname: `${remotePath}/blobs`,
                                })}
                            >
                                <DateString date={object.last_seen} />
                            </Link>
                        ) : (
                            <></>
                        )}
                    </td>
                </tr>
            </Extendable>
        </DataTable>
    );
}
