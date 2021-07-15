import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "@mwdb-web/commons/api";
import {
    ConfirmationModal,
    EditableItem,
    FeatureSwitch,
    UserBadge,
    useViewAlert,
} from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function GroupItem(props) {
    let value = props.value ? props.value : "never";
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || value}</td>
        </tr>
    );
}

export default function GroupDetails({ group, updateGroup }) {
    const viewAlert = useViewAlert();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] = useState(false);

    async function handleUpdate(newValue) {
        try {
            await api.updateGroup(group.name, newValue);
            viewAlert.redirectToAlert({
                target: `/settings/group/${newValue["name"] || group.name}`,
                success: `Group has been successfully updated.`,
            });
            if (!newValue["name"]) updateGroup();
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function handleRemoveGroup() {
        try {
            setDeleteModalDisabled(true);
            await api.removeGroup(group.name);
            viewAlert.redirectToAlert({
                target: `/settings/groups/`,
                success: `Group '${group.name}' has been successfully removed`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
            setDeleteModalOpen(false);
            setDeleteModalDisabled(false);
        }
    }

    if (Object.keys(group).length === 0) return [];

    return (
        <div className="container">
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <GroupItem label="Group name">
                        <EditableItem
                            name="name"
                            defaultValue={group.name}
                            onSubmit={handleUpdate}
                            required
                            pattern="[A-Za-z0-9_-]{1,32}"
                        />
                    </GroupItem>
                    <GroupItem label="Members">
                        {group &&
                            group.users
                                .sort((userA, userB) =>
                                    userA.localeCompare(userB)
                                )
                                .map((user) => (
                                    <UserBadge
                                        user={{ login: user }}
                                        clickable
                                        basePath={"/settings"}
                                    />
                                ))}
                    </GroupItem>
                </tbody>
            </table>
            <b>Group features:</b>
            <FeatureSwitch
                name="workspace"
                value={group["workspace"]}
                onUpdate={handleUpdate}
            >
                <b>Workgroup</b>
                {group["workspace"] ? (
                    <span className="badge badge-success">Enabled</span>
                ) : (
                    []
                )}
                <div>
                    Converts group to the workgroup, so users will see each
                    other within this group. Enabled by default for user-defined
                    groups.
                </div>
            </FeatureSwitch>
            <FeatureSwitch
                name="default"
                value={group["default"]}
                onUpdate={handleUpdate}
            >
                <b>Default group</b>
                {group["default"] ? (
                    <span className="badge badge-success">Enabled</span>
                ) : (
                    []
                )}
                <div>Automatically adds new users to this group.</div>
            </FeatureSwitch>
            <b>Actions:</b>
            <ul className="nav">
                <li className="nav-item">
                    <Link
                        className="nav-link"
                        to={makeSearchLink("uploader", group.name, false, "/")}
                    >
                        Search for uploads
                    </Link>
                    <Link
                        className="nav-link"
                        to={makeSearchLink("shared", group.name, false, "/")}
                    >
                        Search for shared files
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/settings/group/${group.name}/members`}
                    >
                        Show group members
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/settings/group/${group.name}/capabilities`}
                    >
                        Check group capabilities
                    </Link>
                    <a
                        href="#remove-group"
                        className="nav-link text-danger"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setDeleteModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon="trash" />
                        Remove group
                    </a>
                </li>
            </ul>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                disabled={isDeleteModalDisabled}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={handleRemoveGroup}
                message={`Are you sure you want to delete ${group.name} from mwdb`}
                buttonStyle="btn-danger"
            />
        </div>
    );
}
