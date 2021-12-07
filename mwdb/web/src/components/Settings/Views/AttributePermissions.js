import React, { useState, useEffect, useCallback } from "react";

import api from "@mwdb-web/commons/api";
import {
    Autocomplete,
    ConfirmationModal,
    useViewAlert,
} from "@mwdb-web/commons/ui";
import { Link, useParams } from "react-router-dom";

function AttributePermissionsItem({
    group,
    permission,
    updateGroup,
    removeGroup,
}) {
    const [changedPermission, setChangedPermission] = useState({
        read: permission.read,
        set: permission.set,
    });

    function switchPermission(access) {
        setChangedPermission((prevState) => {
            const state = { ...prevState };
            state[access] = !state[access];
            return state;
        });
    }

    function isChanged(access) {
        return changedPermission[access] !== permission[access];
    }

    return (
        <tr key={group}>
            <td>
                <Link to={`/settings/group/${group}`}>{group}</Link>
            </td>
            <td>
                <table className="float-left">
                    <tbody>
                        <tr>
                            <td>
                                <div className="material-switch">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        id={`${group}-readSwitch`}
                                        onChange={() => {
                                            switchPermission("read");
                                        }}
                                        checked={changedPermission["read"]}
                                    />
                                    <label
                                        className="bg-primary"
                                        htmlFor={`${group}-readSwitch`}
                                    />
                                </div>
                                <div>
                                    {isChanged("read") ? (
                                        <span style={{ color: "red" }}>*</span>
                                    ) : (
                                        []
                                    )}
                                    Can read
                                </div>
                            </td>
                            <td>
                                <div className="material-switch">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        id={`${group}-setSwitch`}
                                        onChange={() => {
                                            switchPermission("set");
                                        }}
                                        checked={changedPermission["set"]}
                                    />
                                    <label
                                        className="bg-primary"
                                        htmlFor={`${group}-setSwitch`}
                                    />
                                </div>
                                <div>
                                    {isChanged("set") ? (
                                        <span
                                            style={{
                                                color: "red",
                                            }}
                                        >
                                            *
                                        </span>
                                    ) : (
                                        []
                                    )}
                                    Can set
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
            <td>
                <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!isChanged("read") && !isChanged("set")}
                    onClick={() =>
                        updateGroup(
                            group,
                            changedPermission["read"],
                            changedPermission["set"]
                        )
                    }
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
                            disabled={!newMember}
                        >
                            Add group
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

export function AttributesPermissions({ attribute, getAttribute }) {
    const { attributeKey } = useParams();
    const { setAlert } = useViewAlert();
    const [allGroups, setAllGroups] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [modalSpec, setModalSpec] = useState({});
    const [isModalOpen, setModalOpen] = useState(false);

    const updateAttributePermissions = useCallback(async () => {
        let response = await api.getAttributePermissions(attributeKey);
        let attributePermissions = {};
        for (let permission of response.data["attribute_permissions"])
            attributePermissions[permission["group_name"]] = {
                read: permission["can_read"],
                set: permission["can_set"],
            };
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

    async function updateGroup(group, can_read, can_set) {
        try {
            await api.setAttributePermission(
                attribute.key,
                group,
                can_read,
                can_set
            );
            await updateAttributePermissions();
            setModalOpen(false);
        } catch (error) {
            setAlert({ error });
        }
    }

    function handleUpdateGroup(group, can_read, can_set) {
        setModalOpen(true);
        setModalSpec({
            action: () => updateGroup(group, can_read, can_set),
            message: `Update ${group} group permissions`,
            buttonStyle: "bg-primary",
            confirmText: "Update",
        });
    }

    async function removeGroup(group) {
        try {
            await api.removeAttributePermission(attribute.key, group);
            await updateAttributePermissions();
            setModalOpen(false);
        } catch (error) {
            setAlert({ error });
        }
    }

    function handleRemoveGroup(group) {
        setModalOpen(true);
        setModalSpec({
            action: () => removeGroup(group),
            message: `Remove ${group} group permissions`,
            buttonStyle: "bg-danger",
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

    function handleUpdate() {
        updateAllGroups();
        updateAttributePermissions();
    }

    const getUpdate = useCallback(handleUpdate, [
        updateAllGroups,
        updateAttributePermissions,
    ]);

    useEffect(() => {
        getUpdate();
    }, [getUpdate]);

    if (Object.keys(attribute).length === 0) return [];

    return (
        <React.Fragment>
            <AttributePermissionsBox
                permissions={permissions}
                groups={allGroups}
                addGroup={addGroup}
                updateGroup={handleUpdateGroup}
                removeGroup={handleRemoveGroup}
            />
            <ConfirmationModal
                isOpen={isModalOpen}
                onRequestClose={() => setModalOpen(false)}
                onConfirm={modalSpec.action}
                message={modalSpec.message}
                buttonStyle={modalSpec.buttonStyle}
                confirmText={modalSpec.confirmText}
            />
        </React.Fragment>
    );
}
