import React from "react";
import { Link } from "react-router-dom";

export default function GroupBadge({ group }) {
    return (
        <Link
            to={
                group.private
                    ? `/profile/user/${group.name}`
                    : `/profile/group/${group.name}`
            }
        >
            <span
                className={`badge badge-${
                    group.private ? "primary" : "secondary"
                }`}
            >
                {group.name}
            </span>
        </Link>
    );
}
