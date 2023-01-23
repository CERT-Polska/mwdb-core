import React from "react";
import { Link } from "react-router-dom";

import { faUser, faUsers, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function GroupBadge({ group, clickable, basePath }) {
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
    const base = basePath || "/profile";

    if (!clickable) return badge;

    return (
        <Link
            to={
                group.private
                    ? `${base}/user/${group.name}`
                    : `${base}/group/${group.name}`
            }
        >
            {badge}
        </Link>
    );
}

export function UserBadge({ user, ...props }) {
    return (
        <GroupBadge
            group={{
                name: user.login,
                private: true,
            }}
            {...props}
        />
    );
}
