import { Link } from "react-router-dom";

import { makeSearchLink, makeSearchDateLink } from "@mwdb-web/commons/helpers";
import { Extendable } from "@mwdb-web/commons/plugins";
import { DataTable, DateString } from "@mwdb-web/commons/ui";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { ConfigRows } from "./ConfigRows";

type Props = {
    object: any;
};

export function ConfigTable(props: Props) {
    const object = props.object;
    const remotePath = useRemotePath();

    return (
        <DataTable>
            <Extendable ident="showConfigDetails">
                <tr key="config-family">
                    <th>Family</th>
                    <td id="config_family">
                        <Link
                            to={makeSearchLink({
                                field: "family",
                                value: object.family,
                                pathname: `${remotePath}/configs`,
                            })}
                        >
                            {object.family}
                        </Link>
                    </td>
                </tr>
                <tr key="config-type">
                    <th>Config type</th>
                    <td id="config_family">
                        <Link
                            to={makeSearchLink({
                                field: "type",
                                value: object.config_type,
                                pathname: `${remotePath}/configs`,
                            })}
                        >
                            {object.config_type}
                        </Link>
                    </td>
                </tr>
                <ConfigRows config={object.cfg} />
                <tr key="config-upload-time">
                    <th>Upload time</th>
                    <td id="upload_time">
                        {object.upload_time ? (
                            <Link
                                to={makeSearchDateLink({
                                    field: `upload_time`,
                                    value: object.upload_time,
                                    pathname: `${remotePath}/configs`,
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
