import { Link } from "react-router-dom";

import { faUser, faUsers, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GroupBadgeProps } from "@mwdb-web/types/props";

export function GroupBadge(props: GroupBadgeProps) {
    const { group, clickable, basePath } = props;
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
