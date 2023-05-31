import { Permission } from "@mwdb-web/types/types";
import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

type Access = "read" | "set";

const permissionKeys: (keyof Permission & string)[] = ["read", "set"];

type Props = {
    group: string;
    permission: Permission;
    updateGroup: (group: string, changedPermission: Permission) => void;
    removeGroup: (group: string) => void;
};

export function AttributePermissionsItem({
    group,
    permission,
    updateGroup,
    removeGroup,
}: Props) {
    const [changedPermission, setChangedPermission] =
        useState<Permission>(permission);

    const switchPermission = useCallback((access: Access) => {
        setChangedPermission((prevState) => {
            const state = { ...prevState };
            state[access] = !state[access];
            return state;
        });
    }, []);

    const isChanged = useCallback(
        (access: Access) => {
            return changedPermission[access] !== permission[access];
        },
        [changedPermission, permission]
    );

    const isCanUpdate = useMemo(() => {
        return permissionKeys.reduce((prev, next) => {
            if (!prev) {
                return false;
            }
            return !isChanged(next);
        }, true);
    }, [isChanged]);

    const renderPermission = useCallback(
        (access: Access) => {
            return (
                <div key={access} className="material-switch">
                    <input
                        type="checkbox"
                        className="custom-control-input"
                        id={`${group}-${access}Switch`}
                        onChange={() => {
                            switchPermission(access);
                        }}
                        checked={changedPermission[access]}
                    />
                    <label
                        className="bg-primary"
                        htmlFor={`${group}-${access}Switch`}
                    />
                    <div style={{ width: 60 }}>
                        {isChanged(access) && (
                            <span style={{ color: "red" }}>*</span>
                        )}
                        <span>{`Can ${access}`}</span>
                    </div>
                </div>
            );
        },
        [changedPermission, group, permission]
    );

    return (
        <tr key={group}>
            <td>
                <Link to={`/settings/group/${group}`}>{group}</Link>
            </td>
            <td style={{ display: "flex", gap: 10 }}>
                {permissionKeys.map((per) => renderPermission(per))}
            </td>
            <td>
                <button
                    type="button"
                    className="btn btn-primary mr-3"
                    disabled={isCanUpdate}
                    onClick={() => updateGroup(group, changedPermission)}
                >
                    Update
                </button>
                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeGroup(group)}
                >
                    Remove group
                </button>
            </td>
        </tr>
    );
}
