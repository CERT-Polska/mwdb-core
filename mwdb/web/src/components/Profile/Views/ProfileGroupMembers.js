import React, { useCallback, useContext, useEffect, useState } from "react";
import { Redirect, useParams } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import {
    GroupBadge,
    useViewAlert,
    ConfirmationModal,
} from "@mwdb-web/commons/ui";

function ProfileGroupItems({ workspace, updateWorkspace }) {
    const { setAlert } = useViewAlert();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [removeUser, setRemoveUser] = useState(null);

    async function handleRemoveMember(login) {
        try {
            await api.removeGroupMember(workspace.name, login);
            updateWorkspace();
            setAlert({
                success: `Member '${login}' successfully removed.`,
            });
        } catch (error) {
            setAlert({ error });
        } finally {
            setDeleteModalOpen(false);
            setRemoveUser(null);
        }
    }

    return (
        <React.Fragment>
            {workspace.users
                .sort((userA, userB) => userA.localeCompare(userB))
                .map((login, idx) => (
                    <tr className="nested d-flex">
                        <td className="col-8">
                            <GroupBadge
                                key={idx}
                                group={{
                                    name: login,
                                    private: true,
                                }}
                                clickable
                            />
                            {workspace.admins.includes(login) && " (admin)"}
                        </td>
                        <td className="col-4">
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                    setDeleteModalOpen(true);
                                    setRemoveUser(login);
                                }}
                            >
                                Remove
                            </button>
                        </td>
                    </tr>
                ))}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    handleRemoveMember(removeUser);
                }}
                message={`Are you sure to delete ${removeUser} user from group?`}
            />{" "}
        </React.Fragment>
    );
}

export default function ProfileGroupMembers({ profile }) {
    const auth = useContext(AuthContext);
    const { redirectToAlert } = useViewAlert();
    const { group: groupName } = useParams();
    const [workspaces, setWorkspaces] = useState();

    async function updateWorkspaces() {
        try {
            const response = await api.authGroups();
            setWorkspaces(response.data["groups"]);
        } catch (error) {
            redirectToAlert({
                target: "/profile",
                error,
            });
        }
    }
    const getWorkspaces = useCallback(updateWorkspaces, [redirectToAlert]);

    useEffect(() => {
        getWorkspaces();
    }, [getWorkspaces]);

    if (!workspaces) return [];

    const group = profile.groups.find((group) => group.name === groupName);
    if (!group)
        return (
            <Redirect
                to={{
                    pathname: "/profile",
                    state: {
                        error: `Group ${groupName} doesn't exist`,
                    },
                }}
            />
        );
    if (group.private) return <Redirect to={`/profile/user/${group.name}`} />;

    // Merge it with workspace info
    const workspace = workspaces.find((group) => group.name === groupName);

    if (
        !(
            workspace.admins.includes(auth.user.login) ||
            auth.hasCapability(Capability.manageUsers)
        )
    )
        return (
            <Redirect
                to={{
                    pathname: `/profile/group/${groupName}`,
                    state: {
                        error: `Only group admins have access to group members management.`,
                    },
                }}
            />
        );

    return (
        <div className="container">
            {" "}
            <h4>
                Group <span className="text-monospace">{groupName}</span>{" "}
                members
            </h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <tr className="d-flex">
                        <th className="col-8">User login</th>
                        <th className="col-4">Action</th>
                    </tr>
                    <ProfileGroupItems
                        workspace={workspace}
                        updateWorkspace={getWorkspaces}
                    />
                </tbody>
            </table>
        </div>
    );
}
