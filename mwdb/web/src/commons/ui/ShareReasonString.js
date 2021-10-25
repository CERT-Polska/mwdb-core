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
}) {
    const remotePath = useRemotePath();
    const reasonText =
        reasonType.charAt(0).toUpperCase() + reasonType.slice(1).toLowerCase();
    const objLink = relatedObjectDHash ? (
        <ObjectLink type={relatedObjectType} id={relatedObjectDHash} inline />
    ) : (
        <span className="text-muted">(object deleted)</span>
    );
    const userLink = relatedUserLogin ? (
        <Link
            to={makeSearchLink(
                "uploader",
                relatedUserLogin,
                false,
                `${remotePath}/search`
            )}
        >
            {relatedUserLogin}
        </Link>
    ) : (
        <span className="text-muted">(deleted)</span>
    );

    return (
        <div>
            {reasonText} by {userLink}: {objLink}
        </div>
    );
}
