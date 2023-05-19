import { useState } from "react";
import { isEmpty } from "lodash";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "@mwdb-web/commons/api";
import {
    ConfirmationModal,
    EditableItem,
    PseudoEditableItem,
    FeatureSwitch,
    UserBadge,
} from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { DetailsRecord } from "../common/DetailsRecord";
import { GroupOutletContext } from "@mwdb-web/types/context";
import { Group } from "@mwdb-web/types/types";

export function GroupDetailsView() {
    const viewAlert = useViewAlert();
    const { group, getGroup }: GroupOutletContext = useOutletContext();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] =
        useState<boolean>(false);

    async function handleUpdate(newValue: Partial<Group>) {
        try {
            await api.updateGroup(group.name, newValue);
            viewAlert.redirectToAlert({
                target: `/settings/group/${newValue.name || group.name}`,
                success: `Group has been successfully updated.`,
            });
            if (!newValue.name) getGroup();
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

    if (isEmpty(group)) return <></>;

    return (
        <div className="container">
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <DetailsRecord label="Group name">
                        <EditableItem
                            name="name"
                            defaultValue={group.name!}
                            onSubmit={handleUpdate}
                            required
                            pattern="[A-Za-z0-9_-]{1,32}"
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Members">
                        <PseudoEditableItem
                            editLocation={`/settings/group/${group.name}/members`}
                        >
                            {group &&
                                group.users
                                    .sort((userA, userB) =>
                                        userA.localeCompare(userB)
                                    )
                                    .map((user) => (
                                        <UserBadge
                                            group={{}}
                                            key={user}
                                            user={{ login: user }}
                                            clickable
                                            basePath={"/settings"}
                                        />
                                    ))}
                        </PseudoEditableItem>
                    </DetailsRecord>
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
                    <></>
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
                    <></>
                )}
                <div>Automatically adds new users to this group.</div>
            </FeatureSwitch>
            <b>Actions:</b>
            <ul className="nav">
                <li className="nav-item">
                    <Link
                        className="nav-link"
                        to={makeSearchLink({
                            field: "uploader",
                            value: group.name,
                            pathname: "/",
                        })}
                    >
                        Search for uploads
                    </Link>
                    <Link
                        className="nav-link"
                        to={makeSearchLink({
                            field: "shared",
                            value: group.name,
                            pathname: "/",
                        })}
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
                        <FontAwesomeIcon icon={faTrash} />
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
