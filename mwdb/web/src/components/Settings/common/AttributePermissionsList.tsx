import { Permission } from "@mwdb-web/types/types";
import { AttributePermissionsItem } from "./AttributePermissionsItem";

type Props = {
    permissions: Record<string, Permission>;
    updateGroup: (group: string, changedPermission: Permission) => void;
    removeGroup: (group: string) => void;
};

export function AttributePermissionsList({
    permissions,
    updateGroup,
    removeGroup,
}: Props) {
    return (
        <table className="table table-striped table-bordered wrap-table">
            <thead>
                <tr>
                    <th>Group name</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {Object.keys(permissions)
                    .sort()
                    .map((group) => (
                        <AttributePermissionsItem
                            key={group}
                            group={group}
                            permission={permissions[group]}
                            updateGroup={updateGroup}
                            removeGroup={removeGroup}
                        />
                    ))}
            </tbody>
        </table>
    );
}
