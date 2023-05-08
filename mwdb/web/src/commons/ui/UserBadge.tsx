import { GrpupBadgeProps } from "@mwdb-web/types/props";
import { User } from "@mwdb-web/types/types";
import GroupBadge from "./GroupBadge";

type Props = GrpupBadgeProps & {
    user: User;
};

export default function UserBadge({ user, ...props }: Props) {
    return (
        <GroupBadge
            {...props}
            group={{
                ...props.group,
                name: user.login,
                private: true,
            }}
        />
    );
}
