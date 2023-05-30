import { Link } from "react-router-dom";

import { GroupBadge, HighlightText, LimitTo } from "@mwdb-web/commons/ui";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FeedQuality, Group } from "@mwdb-web/types/types";

type Props = {
    groups: Group[];
    feed_quality?: FeedQuality;
    login: string;
    filterValue?: string;
    disabled?: boolean;
    email?: string;
};

export function UserItem(props: Props) {
    const groups = props.groups.filter((c) => c.name !== "public");
    let feed_badge = (
        <span className="badge badge-secondary">
            <FontAwesomeIcon icon={faUser} size="xs" /> {props.feed_quality}
        </span>
    );

    if (props.feed_quality === "low") {
        feed_badge = (
            <span className="badge badge-danger">
                <FontAwesomeIcon icon={faRobot} size="xs" />{" "}
                {props.feed_quality}
            </span>
        );
    }

    return (
        <tr key={props.login}>
            <td>
                <Link to={`/settings/user/${props.login}`}>
                    <HighlightText filterValue={props.filterValue ?? ""}>
                        {props.login}
                    </HighlightText>
                </Link>
                {props.disabled ? (
                    <span className="badge badge-danger">blocked</span>
                ) : (
                    []
                )}
            </td>
            <td>
                <a href={`mailto:${props.email}`}>
                    <HighlightText filterValue={props.filterValue ?? ""}>
                        {props.email ?? ""}
                    </HighlightText>
                </a>
            </td>
            <td>{feed_badge}</td>
            <td>
                <LimitTo count={5}>
                    {groups
                        .filter((group) => group.name !== props.login)
                        .map((group) => (
                            <GroupBadge
                                key={group.name}
                                group={group}
                                clickable
                                basePath="/settings"
                            />
                        ))}
                </LimitTo>
            </td>
        </tr>
    );
}
