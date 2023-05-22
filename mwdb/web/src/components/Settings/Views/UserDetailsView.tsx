import { useState } from "react";
import { isEmpty } from "lodash";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "@mwdb-web/commons/api";
import {
    DateString,
    ConfirmationModal,
    EditableItem,
    PseudoEditableItem,
    GroupBadge,
} from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faTrash } from "@fortawesome/free-solid-svg-icons";
import { DetailsRecord } from "../common/DetailsRecord";
import { UserOutletContext } from "@mwdb-web/types/context";
import { UpdateUserRequest } from "@mwdb-web/types/api";

export function UserDetailsView() {
    const viewAlert = useViewAlert();
    const { user, getUser }: UserOutletContext = useOutletContext();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] =
        useState<boolean>(false);
    const [isBlockModalOpen, setBlockModalOpen] = useState<boolean>(false);
    const [isBlockModalDisabled, setBlockModalDisabled] =
        useState<boolean>(false);

    async function handleSubmit(newValue: Partial<UpdateUserRequest>) {
        try {
            await api.updateUser({ ...newValue, login: user.login });
            viewAlert.setAlert({
                success: "User successfully updated.",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        } finally {
            getUser();
        }
    }

    async function setDisabledState(ban: boolean) {
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

    if (isEmpty(user)) return <></>;

    return (
        <div className="container">
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <DetailsRecord label="E-mail">
                        <EditableItem
                            name="email"
                            type="email"
                            defaultValue={user.email!}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Additional info">
                        <EditableItem
                            name="additionalInfo"
                            defaultValue={user.additional_info!}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Feed quality">
                        <EditableItem
                            name="feedQuality"
                            defaultValue={user.feed_quality!}
                            onSubmit={handleSubmit}
                            badge
                            selective
                        >
                            <option value="high">high</option>
                            <option value="low">low</option>
                        </EditableItem>
                    </DetailsRecord>
                    <DetailsRecord
                        label="Requested on"
                        value={user.requested_on}
                    >
                        <DateString date={user.requested_on} />
                    </DetailsRecord>
                    <DetailsRecord
                        label="Registered on"
                        value={user.registered_on}
                    >
                        <DateString date={user.registered_on} />
                    </DetailsRecord>
                    <DetailsRecord label="Last login" value={user.logged_on}>
                        <DateString date={user.logged_on} />
                    </DetailsRecord>
                    <DetailsRecord
                        label="Last password set"
                        value={user.set_password_on}
                    >
                        <DateString date={user.set_password_on} />
                    </DetailsRecord>
                    <DetailsRecord
                        label="Groups"
                        value={user.groups && user.groups.length}
                    >
                        <PseudoEditableItem
                            editLocation={`/settings/user/${user.login}/groups`}
                        >
                            {user.groups &&
                                user.groups
                                    .filter((group) => !group.private)
                                    .sort((groupA, groupB) =>
                                        groupA.name.localeCompare(groupB.name)
                                    )
                                    .map((group, index) => (
                                        <GroupBadge
                                            key={group.name}
                                            group={group}
                                            clickable
                                            basePath="/settings"
                                        />
                                    ))}
                        </PseudoEditableItem>
                    </DetailsRecord>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav">
                <li className="nav-item">
                    <Link
                        className="nav-link"
                        to={makeSearchLink({
                            field: "uploader",
                            value: user.login,
                            pathname: "/",
                        })}
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
                            <FontAwesomeIcon icon={faBan} />
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
                            <FontAwesomeIcon icon={faBan} />
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
                        <FontAwesomeIcon icon={faTrash} />
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
