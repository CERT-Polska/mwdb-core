import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";

import { makeSearchConfigLink } from "@mwdb-web/commons/helpers";
import { ActionCopyToClipboard, ObjectLink } from "@mwdb-web/commons/ui";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { ConfigRows } from "./ConfigRows";

type Props = {
    configKey: string;
    value: any;
    path: string[];
    indent: number;
    parentExpanded?: boolean;
};

export function ConfigRow(props: Props) {
    const { configKey: key, value, path, indent } = props;
    const [expanded, setExpanded] = useState(false);

    const isObject = value && typeof value === "object";
    const isEmbeddedBlob =
        isObject &&
        Object.keys(value).length === 1 &&
        Object.keys(value)[0] === "in-blob";
    const isRegularObject = isObject && !isEmbeddedBlob;

    const remotePath = useRemotePath();

    useEffect(() => {
        // Automatically expand all nested objects if parent has been expanded
        if (props.parentExpanded && isRegularObject && !expanded)
            setExpanded(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.parentExpanded]);

    let rawValue, prettyValue;

    if (isRegularObject) {
        rawValue = prettyValue = JSON.stringify(value, null, 4);
    } else if (isEmbeddedBlob) {
        rawValue = value["in-blob"];
        prettyValue = (
            <ObjectLink type="blob" id={value["in-blob"]} className="blob" />
        );
    } else {
        rawValue = String(value);
        prettyValue = (
            <Link
                to={makeSearchConfigLink({
                    field: path,
                    value: value,
                    pathname: `${remotePath}/configs`,
                })}
            >
                {String(value)}
            </Link>
        );
    }

    const overflow: React.CSSProperties = {
        maxWidth: "700px",
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
    };

    return (
        <React.Fragment>
            <tr className="flickerable">
                <th
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpanded(!expanded)}
                >
                    <FontAwesomeIcon
                        icon={expanded ? faMinus : faPlus}
                        size="sm"
                    />{" "}
                    {key}
                </th>
                {expanded && !isRegularObject ? (
                    <td>
                        <pre style={{ whiteSpace: "pre-wrap" }}>{rawValue}</pre>
                    </td>
                ) : (
                    <td style={overflow} className="text-monospace">
                        {prettyValue}
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={rawValue}
                                tooltipMessage="Copy value to clipboard"
                            />
                        </span>
                    </td>
                )}
            </tr>
            {expanded && isRegularObject ? (
                <tr className="nested">
                    <td className="nested" colSpan={2} style={{ padding: 0 }}>
                        <ConfigRows
                            config={value}
                            parentExpanded={true}
                            indent={indent + 1}
                            path={path}
                        />
                    </td>
                </tr>
            ) : (
                <></>
            )}
        </React.Fragment>
    );
}
