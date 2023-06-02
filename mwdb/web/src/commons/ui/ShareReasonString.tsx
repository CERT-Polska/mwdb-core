import { Link } from "react-router-dom";

import { ObjectLink } from "./ObjectLink";
import { useRemotePath } from "../remotes";
import { makeSearchLink } from "../helpers";
import { ObjectType } from "@mwdb-web/types/types";

type Props = {
    reasonType: string;
    relatedObjectDHash: string;
    relatedObjectType: ObjectType;
    relatedUserLogin: string;
    showDhash: boolean;
};

export function ShareReasonString({
    reasonType,
    relatedObjectDHash,
    relatedObjectType,
    relatedUserLogin,
    showDhash,
}: Props) {
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
