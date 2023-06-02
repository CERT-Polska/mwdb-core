import { GroupBadgeProps } from "@mwdb-web/types/props";
import { User } from "@mwdb-web/types/types";
import { GroupBadge } from "./GroupBadge";

type Props = GroupBadgeProps & {
    user: Partial<User>;
};

export function UserBadge({ user, ...props }: Props) {
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
