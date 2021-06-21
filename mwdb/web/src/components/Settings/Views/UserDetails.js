import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "@mwdb-web/commons/api";
import {
    DateString,
    ConfirmationModal,
    EditableItem,
    GroupBadge,
    useViewAlert,
} from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function UserItem(props) {
    let value = props.value ? props.value : "never";
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || value}</td>
        </tr>
    );
}

export default function UserDetails({ user, getUser }) {
    const viewAlert = useViewAlert();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] = useState(false);
    const [isBlockModalOpen, setBlockModalOpen] = useState(false);
    const [isBlockModalDisabled, setBlockModalDisabled] = useState(false);

    async function handleSubmit(newValue) {
        try {
            await api.updateUser(user.login, newValue);
            viewAlert.setAlert({
                success: "User successfully updated.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        } finally {
            getUser();
        }
    }

    async function setDisabledState(ban) {
        try {
            setBlockModalDisabled(true);
            await api.setUserDisabled(user.login, ban);
            viewAlert.setAlert({
                success: `User successfully ${ban ? "blocked" : "unblocked"}.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        } finally {
            setBlockModalDisabled(false);
            setBlockModalOpen(false);
            getUser();
        }
    }

    async function handleRemoveUser() {
        try {
            setDeleteModalDisabled(true);
            await api.removeUser(user.login);
            viewAlert.redirectToAlert({
                target: "/settings/users",
                success: `User '${user.login}' successfully removed.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
            setDeleteModalDisabled(false);
        }
    }

    if (!user) return [];

    return (
        <div className="container">
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <UserItem label="E-mail">
                        <EditableItem
                            name="email"
                            type="email"
                            defaultValue={user.email}
                            onSubmit={handleSubmit}
                        />
                    </UserItem>
                    <UserItem label="Additional info">
                        <EditableItem
                            name="additionalInfo"
                            defaultValue={user.additional_info}
                            onSubmit={handleSubmit}
                        />
                    </UserItem>
                    <UserItem label="Feed quality">
                        <EditableItem
                            name="feedQuality"
                            defaultValue={user.feed_quality}
                            onSubmit={handleSubmit}
                            badge
                            selective
                        >
                            <option value="high">high</option>
                            <option value="low">low</option>
                        </EditableItem>
                    </UserItem>
                    <UserItem label="Requested on" value={user.requested_on}>
                        <DateString date={user.requested_on} />
                    </UserItem>
                    <UserItem label="Registered on" value={user.registered_on}>
                        <DateString date={user.registered_on} />
                    </UserItem>
                    <UserItem label="Last login" value={user.logged_on}>
                        <DateString date={user.logged_on} />
                    </UserItem>
                    <UserItem
                        label="Last password set"
                        value={user.set_password_on}
                    >
                        <DateString date={user.set_password_on} />
                    </UserItem>
                    <UserItem
                        label="Groups"
                        value={user.groups && user.groups.length}
                    >
                        {user.groups &&
                            user.groups
                                .filter((group) => !group.private)
                                .sort((groupA, groupB) =>
                                    groupA.name.localeCompare(groupB.name)
                                )
                                .map((group) => (
                                    <GroupBadge
                                        group={group}
                                        clickable
                                        basePath="/settings"
                                    />
                                ))}
                    </UserItem>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav">
                <li className="nav-item">
                    <Link
                        className="nav-link"
                        to={makeSearchLink("uploader", user.login, false, "/")}
                    >
                        Search for uploads
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/settings/user/${user.login}/groups`}
                    >
                        Show user groups
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/settings/user/${user.login}/capabilities`}
                    >
                        Check user capabilities
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/settings/user/${user.login}/api-keys`}
                    >
                        Manage API keys
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/settings/user/${user.login}/password`}
                    >
                        Change password
                    </Link>
                    {user.disabled ? (
                        <a
                            href="#block-user"
                            className="nav-link text-danger"
                            onClick={(ev) => {
                                ev.preventDefault();
                                setBlockModalOpen(true);
                            }}
                        >
                            <FontAwesomeIcon icon="ban" />
                            Unblock user
                        </a>
                    ) : (
                        <a
                            href="#block-user"
                            className="nav-link text-danger"
                            onClick={(ev) => {
                                ev.preventDefault();
                                setBlockModalOpen(true);
                            }}
                        >
                            <FontAwesomeIcon icon="ban" />
                            Block user
                        </a>
                    )}
                    <a
                        href="#remove-user"
                        className="nav-link text-danger"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setDeleteModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon="trash" />
                        Remove user
                    </a>
                </li>
            </ul>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                disabled={isDeleteModalDisabled}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={handleRemoveUser}
                message={`Are you sure you want to delete ${user.login} from mwdb`}
                buttonStyle="btn-danger"
            />
            <ConfirmationModal
                isOpen={isBlockModalOpen}
                disabled={isBlockModalDisabled}
                onRequestClose={() => setBlockModalOpen(false)}
                onConfirm={() => setDisabledState(!user.disabled)}
                message={`Are you sure you want to ${
                    user.disabled ? "unblock" : "block"
                } ${user.login}?`}
                buttonStyle="btn-danger"
            />
        </div>
    );
}
