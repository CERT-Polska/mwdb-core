import React from "react";
import { Link } from "react-router-dom";

import { faUser, faUsers, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function GroupBadge({ group, clickable }) {
    const icon = group.private
        ? faUser
        : group.name === "public"
        ? faGlobe
        : faUsers;
    const badge = (
        <span
            className={`badge badge-${group.private ? "primary" : "secondary"}`}
        >
            <FontAwesomeIcon icon={icon} /> {group.name}
        </span>
    );

    if (!clickable) return badge;

    return (
        <Link
            to={
                group.private
                    ? `/profile/user/${group.name}`
                    : `/profile/group/${group.name}`
            }
        >
            {badge}
        </Link>
    );
}
