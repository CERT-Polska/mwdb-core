import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "@mwdb-web/commons/api";
import {
    ConfirmationModal,
    EditableItem,
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

export default function GroupDetails({ group }) {
    const viewAlert = useViewAlert();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] = useState(false);

    async function handleSubmit(newName) {
        try {
            await api.updateGroup(group.name, newName["name"], undefined);
            viewAlert.setAlert({
                success: `Group successfully updated.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function handleRemoveGroup() {
        try {
            setDeleteModalDisabled(true);
            await api.removeGroup(group.name);
            viewAlert.redirectToAlert({
                target: `/admin/groups/`,
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
                            onSubmit={handleSubmit}
                        />
                    </GroupItem>
                    <GroupItem label="Members">
                        {group &&
                            group.users.map((user) => (
                                <Link to={`/admin/user/${user}`}>
                                    <span className="badge badge-secondary">
                                        {user}
                                    </span>
                                </Link>
                            ))}
                    </GroupItem>
                </tbody>
            </table>
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
                        to={`/admin/group/${group.name}/members`}
                    >
                        Show group members
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/admin/group/${group.name}/capabilities`}
                    >
                        Check group capabilities
                    </Link>
                    <a
                        href="#remove-group"
                        className="nav-link text-danger"
                        onClick={() => setDeleteModalOpen(true)}
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
                message={`Are tou sure you want to delete ${group.name} from mwdb`}
                buttonStyle="btn-danger"
            />
        </div>
    );
}
