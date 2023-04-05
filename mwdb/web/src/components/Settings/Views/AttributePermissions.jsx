import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useOutletContext } from "react-router-dom";
import { isEmpty } from "lodash";
import { api } from "@mwdb-web/commons/api";
import {
    Autocomplete,
    ConfirmationModal,
    useViewAlert,
} from "@mwdb-web/commons/ui";

const permissionKeys = ["read", "set"];

function setInitPermission(permission) {
    return permissionKeys.reduce((prev, next) => {
        return {
            ...prev,
            [next]: permission[next],
        };
    }, {});
}

function AttributePermissionsItem({
    group,
    permission,
    updateGroup,
    removeGroup,
}) {
    const [changedPermission, setChangedPermission] = useState(
        setInitPermission(permission)
    );

    const switchPermission = useCallback((access) => {
        setChangedPermission((prevState) => {
            const state = { ...prevState };
            state[access] = !state[access];
            return state;
        });
    }, []);

    const isChanged = useCallback(
        (access) => {
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
        (access) => {
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

function AttributePermissionsBox({
    permissions,
    groups,
    addGroup,
    updateGroup,
    removeGroup,
}) {
    const [newMember, setNewMember] = useState("");

    const isAddGroupDisabled = useMemo(() => {
        const isGroupAlreadyAdded =
            Object.keys(permissions).includes(newMember);
        return !newMember || isGroupAlreadyAdded;
    }, [newMember, permissions]);

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
                <tr>
                    <td>
                        <Autocomplete
                            value={newMember}
                            items={groups.filter(
                                (item) =>
                                    item.name
                                        .toLowerCase()
                                        .indexOf(newMember.toLowerCase()) !== -1
                            )}
                            getItemValue={(item) => item.name}
                            onChange={(value) => setNewMember(value)}
                            className="form-control"
                        />
                    </td>
                    <td />
                    <td>
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => newMember && addGroup(newMember)}
                            disabled={isAddGroupDisabled}
                        >
                            Add group
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

export function AttributesPermissions() {
    const { attributeKey } = useParams();
    const { attribute } = useOutletContext();
    const { setAlert } = useViewAlert();
    const [allGroups, setAllGroups] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [modalSpec, setModalSpec] = useState({});

    const updateAttributePermissions = useCallback(async () => {
        const response = await api.getAttributePermissions(attributeKey);
        const attributePermissions = response.data.attribute_permissions.reduce(
            (prev, next) => {
                return {
                    ...prev,
                    [next.group_name]: {
                        read: next.can_read,
                        set: next.can_set,
                    },
                };
            },
            {}
        );
        setPermissions(attributePermissions);
    }, [attributeKey]);

    async function addGroup(group) {
        try {
            await api.setAttributePermission(
                attribute.key,
                group,
                false,
                false
            );
            await updateAttributePermissions();
        } catch (error) {
            setAlert({ error });
        }
    }

    async function updateGroup(group, permissions) {
        const { read, set } = permissions;
        try {
            await api.setAttributePermission(attribute.key, group, read, set);
            await updateAttributePermissions();
            setModalSpec({});
        } catch (error) {
            setAlert({ error });
        }
    }

    function handleUpdateGroup(group, permissions) {
        setModalSpec({
            action: () => updateGroup(group, permissions),
            message: `Update ${group} group permissions`,
            buttonStyle: "btn-primary",
            confirmText: "Update",
        });
    }

    async function removeGroup(group) {
        try {
            await api.removeAttributePermission(attribute.key, group);
            await updateAttributePermissions();
            setModalSpec({});
        } catch (error) {
            setAlert({ error });
        }
    }

    function handleRemoveGroup(group) {
        setModalSpec({
            action: () => removeGroup(group),
            message: `Remove ${group} group permissions`,
            buttonStyle: "btn-danger",
            confirmText: "Remove",
        });
    }

    const updateAllGroups = useCallback(async () => {
        try {
            const response = await api.getGroups();
            setAllGroups(response.data.groups);
        } catch (error) {
            setAlert({ error });
        }
    }, [setAlert]);

    const getUpdate = useCallback(() => {
        updateAllGroups();
        updateAttributePermissions();
    }, [updateAllGroups, updateAttributePermissions]);

    useEffect(() => {
        getUpdate();
    }, [getUpdate]);

    if (Object.keys(attribute).length === 0) return <></>;

    return (
        <>
            <AttributePermissionsBox
                permissions={permissions}
                groups={allGroups}
                addGroup={addGroup}
                updateGroup={handleUpdateGroup}
                removeGroup={handleRemoveGroup}
            />
            <ConfirmationModal
                isOpen={!isEmpty(modalSpec)}
                onRequestClose={() => setModalSpec({})}
                onConfirm={modalSpec.action}
                message={modalSpec.message}
                buttonStyle={modalSpec.buttonStyle}
                confirmText={modalSpec.confirmText}
            />
        </>
    );
}
