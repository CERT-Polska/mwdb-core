import React from "react";
import { Link } from "react-router-dom";
import { useRemote } from "@mwdb-web/commons/remotes";
import ObjectLink from "./ObjectLink";
import { makeSearchLink } from "../helpers";

export default function RefString(props) {
    const remote = useRemote();
    const remotePath = remote ? `remote/${remote}/` : "";
    const reasonText =
        props.reason_type.charAt(0).toUpperCase() +
        props.reason_type.slice(1).toLowerCase();
    const objLink = props.related_object_dhash ? (
        <ObjectLink
            type={props.related_object_type}
            id={props.related_object_dhash}
            inline
        />
    ) : (
        <span className="text-muted">(object deleted)</span>
    );
    const userLink = (
        <Link
            to={makeSearchLink(
                "uploader",
                props.related_user_login,
                false,
                `${remotePath}search`
            )}
        >
            {props.related_user_login}
        </Link>
    );

    return (
        <div>
            {reasonText} {objLink} by {userLink}
        </div>
    );
}
