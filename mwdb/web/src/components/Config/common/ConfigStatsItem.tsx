import { Link } from "react-router-dom";

import { DateString } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { Family } from "@mwdb-web/types/types";

export function ConfigStatsItem(props: Family) {
    return (
        <tr>
            <td>
                <Link
                    to={makeSearchLink({
                        field: "family",
                        value: props.family,
                        pathname: "/configs",
                    })}
                >
                    {props.family}
                </Link>
            </td>
            <td>
                <DateString date={props.last_upload} />
            </td>
            <td>{props.count}</td>
        </tr>
    );
}
