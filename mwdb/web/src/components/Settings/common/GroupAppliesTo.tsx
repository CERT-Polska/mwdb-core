import { Link } from "react-router-dom";
import { intersperse } from "@mwdb-web/commons/helpers";
import { Group } from "@mwdb-web/types/types";

type Props = {
    group: Group;
};

export function GroupAppliesTo({ group }: Props) {
    if (group.name === "public")
        return (
            <small className="text-muted">
                Applies to all users in MWDB system
            </small>
        );
    return (
        <div>
            <small className="text-muted">
                Applies to{" "}
                {intersperse(
                    group.users.slice(0, 3).map((user: string) => (
                        <Link key={user} to={`/settings/user/${user}`}>
                            {user}
                        </Link>
                    )),
                    ", "
                )}
                {group.users.length > 3 ? (
                    ` and ${group.users.length - 3}  more...`
                ) : (
                    <></>
                )}
            </small>
        </div>
    );
}
