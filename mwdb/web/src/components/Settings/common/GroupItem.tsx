import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";

import { LimitTo, UserBadge, HighlightText } from "@mwdb-web/commons/ui";
import { Group } from "@mwdb-web/types/types";

export type Props = Group & {
    filterValue?: string;
};

export function GroupItem(props: Props) {
    const lockAttributes = props.immutable
        ? { icon: faLock, tip: "Immutable group" }
        : { icon: faLockOpen, tip: "Mutable group" };

    return (
        <tr key={props.name}>
            <td>
                <Link to={`/settings/group/${props.name}`}>
                    <HighlightText filterValue={props.filterValue ?? ""}>
                        {props.name}
                    </HighlightText>
                </Link>
                <span data-toggle="tooltip" title={lockAttributes.tip}>
                    <FontAwesomeIcon
                        icon={lockAttributes.icon}
                        pull="left"
                        size="1x"
                        style={{ color: "grey" }}
                    />
                </span>
            </td>
            <td>
                {props.name === "public" ? (
                    "(Group is public and contains all members)"
                ) : (
                    <LimitTo count={5}>
                        {props.users.map((login) => (
                            <UserBadge
                                group={{}}
                                key={login}
                                user={{ login }}
                                clickable
                                basePath="/settings"
                            />
                        ))}
                    </LimitTo>
                )}
            </td>
        </tr>
    );
}
