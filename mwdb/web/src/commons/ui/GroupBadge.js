import React from "react";
import { Link } from "react-router-dom";

export default function GroupBadge({ group, clickable }) {
    const badge = (
        <span
            className={`badge badge-${group.private ? "primary" : "secondary"}`}
        >
            {group.name}
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
