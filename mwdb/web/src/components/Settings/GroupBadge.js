import React from "react";
import { Link } from "react-router-dom";

export default function GroupBadge({ group }) {
    return (
        <Link
            to={
                group.private
                    ? `/settings/user/${group.name}`
                    : `/settings/group/${group.name}`
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
