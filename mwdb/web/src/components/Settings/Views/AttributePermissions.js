import React, { Component, useState, useEffect, useCallback } from "react";

import api from "@mwdb-web/commons/api";
import {
    Autocomplete,
    ConfirmationModal,
    useViewAlert,
} from "@mwdb-web/commons/ui";
import { Link, useParams } from "react-router-dom";

class AttributePermissionsBox extends Component {
    state = {
        changedPermissions: {},
        newMember: "",
    };

    isPermissionChanged(groupName, permission) {
        let permset = this.state.changedPermissions[groupName];
        return (
            permset &&
            permset[permission] !==
                this.props.permissions[groupName][permission]
        );
    }

    getPermission(groupName, permission) {
        let permset =
            this.state.changedPermissions[groupName] ||
            this.props.permissions[groupName];
        return permset[permission];
    }

    switchPermission(groupName, permission) {
        let changedPermissions = { ...this.state.changedPermissions };
        if (!changedPermissions[groupName])
            changedPermissions[groupName] = {
                read: this.props.permissions[groupName].read,
                set: this.props.permissions[groupName].set,
            };
        changedPermissions[groupName][permission] =
            !changedPermissions[groupName][permission];
        this.setState({ changedPermissions });
    }

    render() {
        return (
            <div>
                <table className="table table-striped table-bordered wrap-table">
                    <thead>
                        <tr>
                            <th>Group name</th>
                            <th>Permissions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(this.props.permissions)
                            .sort()
                            .map((permGroup) => (
                                <tr key={permGroup}>
                                    <td>
                                        <Link
                                            to={`/settings/group/${permGroup}`}
                                        >
                                            {permGroup}
                                        </Link>
                                    </td>
                                    <td>
                                        <table className="float-left">
                                            <tr>
                                                <td>
                                                    <div className="material-switch">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-control-input"
                                                            id={`${permGroup}-readSwitch`}
                                                            onChange={(ev) => {
                                                                this.switchPermission(
                                                                    permGroup,
                                                                    "read"
                                                                );
                                                            }}
                                                            checked={this.getPermission(
                                                                permGroup,
                                                                "read"
                                                            )}
                                                        />
                                                        <label
                                                            className="bg-primary"
                                                            htmlFor={`${permGroup}-readSwitch`}
                                                        />
                                                    </div>
                                                    <div>
                                                        {this.isPermissionChanged(
                                                            permGroup,
                                                            "read"
                                                        ) ? (
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
                                                        Can read
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="material-switch">
                                                        <input
                                                            type="checkbox"
                                                            className="custom-control-input"
                                                            id={`${permGroup}-setSwitch`}
                                                            onChange={(ev) => {
                                                                this.switchPermission(
                                                                    permGroup,
                                                                    "set"
                                                                );
                                                            }}
                                                            checked={this.getPermission(
                                                                permGroup,
                                                                "set"
                                                            )}
                                                        />
                                                        <label
                                                            className="bg-primary"
                                                            htmlFor={`${permGroup}-setSwitch`}
                                                        />
                                                    </div>
                                                    <div>
                                                        {this.isPermissionChanged(
                                                            permGroup,
                                                            "set"
                                                        ) ? (
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
                                        </table>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={
                                                !this.isPermissionChanged(
                                                    permGroup,
                                                    "read"
                                                ) &&
                                                !this.isPermissionChanged(
                                                    permGroup,
                                                    "set"
                                                )
                                            }
                                            onClick={() =>
                                                this.props.updateGroup(
                                                    permGroup,
                                                    this.getPermission(
                                                        permGroup,
                                                        "read"
                                                    ),
                                                    this.getPermission(
                                                        permGroup,
                                                        "set"
                                                    )
                                                )
                                            }
                                        >
                                            Update
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() =>
                                                this.props.removeGroup(
                                                    permGroup
                                                )
                                            }
                                        >
                                            Remove group
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        <tr>
                            <td>
                                <Autocomplete
                                    value={this.state.newMember}
                                    items={this.props.groupItems.filter(
                                        (item) =>
                                            item.name
                                                .toLowerCase()
                                                .indexOf(
                                                    this.state.newMember.toLowerCase()
                                                ) !== -1
                                    )}
                                    getItemValue={(item) => item.name}
                                    onChange={(value) =>
                                        this.setState({ newMember: value })
                                    }
                                    className="form-control"
                                />
                            </td>
                            <td />
                            <td>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() =>
                                        this.state.newMember &&
                                        this.props.addGroup(
                                            this.state.newMember
                                        )
                                    }
                                    disabled={!this.state.newMember}
                                >
                                    Add group
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

export function AttributesPermissions({ attribute, getAttribute }) {
    const { metakey } = useParams();
    const { setAlert } = useViewAlert();
    const [allGroups, setAllGroups] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [modalSpec, setModalSpec] = useState({});
    const [isModalOpen, setModalOpen] = useState(false);

    async function addGroup(group) {
        try {
            await api.setMetakeyPermission(attribute.key, group, false, false);
            getAttribute();
        } catch (error) {
            setAlert({ error });
        }
    }

    async function updateGroup(group, can_read, can_set) {
        try {
            await api.setMetakeyPermission(
                attribute.key,
                group,
                can_read,
                can_set
            );
            getAttribute();
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
            await api.deleteMetakeyPermission(attribute.key, group);
            getAttribute();
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

    const updateAttributePermissions = useCallback(async () => {
        let response = await api.getMetakeyDefinition(metakey);
        let attributePermissions = {};
        for (let permission of response.data.permissions)
            attributePermissions[permission["group_name"]] = {
                read: permission["can_read"],
                set: permission["can_set"],
            };
        setPermissions(attributePermissions);
    }, [metakey]);

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
                groupItems={allGroups}
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
