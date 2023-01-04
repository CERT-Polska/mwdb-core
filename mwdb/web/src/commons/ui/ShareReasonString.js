import React from "react";
import { Link } from "react-router-dom";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import ObjectLink from "./ObjectLink";
import { makeSearchLink } from "../helpers";

export default function ShareReasonString({
    reasonType,
    relatedObjectDHash,
    relatedObjectType,
    relatedUserLogin,
    showDhash,
}) {
    const remotePath = useRemotePath();
    const reasonText =
        reasonType.charAt(0).toUpperCase() + reasonType.slice(1).toLowerCase();
    const isShared = reasonType === "shared";
    const objLink = showDhash ? (
        relatedObjectDHash ? (
            <ObjectLink
                type={relatedObjectType}
                id={relatedObjectDHash}
                inline
            />
        ) : (
            <span className="text-muted">(object deleted)</span>
        )
    ) : (
        ""
    );
    const userLink = relatedUserLogin ? (
        <Link
            to={makeSearchLink({
                field: isShared ? "sharer" : "uploader",
                value: relatedUserLogin,
                pathname: `${remotePath}/search`,
            })}
        >
            {isShared ? relatedUserLogin : ""}
        </Link>
    ) : (
        <span className="text-muted">(deleted)</span>
    );

    return isShared ? (
        <div>
            {reasonText} by {userLink}: {objLink}
        </div>
    ) : (
        <div>
            {reasonText} by: {objLink}
        </div>
    );
}
