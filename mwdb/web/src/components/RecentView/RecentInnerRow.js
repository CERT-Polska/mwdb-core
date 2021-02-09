import React from "react";
import { ActionCopyToClipboard } from "@mwdb-web/commons/ui";

export default function RecentInnerRow(props) {
    const classNames = (props.narrowOnly
        ? ["d-lg-none", "d-flex"]
        : props.wideOnly
        ? ["d-none", "d-lg-flex"]
        : ["d-flex"]
    ).concat(props.copyable ? ["flickerable"] : []);
    return (
        <div className={classNames.join(" ")}>
            {props.label ? (
                <b style={{ minWidth: props.labelWidth }}>{props.label}: </b>
            ) : (
                []
            )}
            {props.icon}
            <div
                className={!props.noEllipsis ? "recent-field" : ""}
                data-toggle="tooltip"
                title={props.value}
            >
                {props.children || props.value}
            </div>
            {props.copyable ? (
                <span className="ml-2">
                    <ActionCopyToClipboard
                        text={props.value}
                        tooltipMessage="Copy to clipboard"
                    />
                </span>
            ) : (
                []
            )}
        </div>
    );
}
