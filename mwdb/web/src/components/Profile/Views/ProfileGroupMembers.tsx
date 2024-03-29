import { useContext, useEffect, useState } from "react";
import { Navigate, useParams, useOutletContext } from "react-router-dom";
import { isEmpty, isNil } from "lodash";

import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { Capability } from "@mwdb-web/types/types";
import { ProfileGroupItems } from "../common/ProfileGroupItems";
import { ProfileOutletContext } from "@mwdb-web/types/context";
import { Group } from "@mwdb-web/types/types";

export function ProfileGroupMembers() {
    const auth = useContext(AuthContext);
    const { redirectToAlert } = useViewAlert();
    const { profile }: ProfileOutletContext = useOutletContext();
    const { group: groupName } = useParams();
    const [workspaces, setWorkspaces] = useState<Group[]>([]);

    const group = profile.groups.find((group) => group.name === groupName);

    useEffect(() => {
        getWorkspaces();
    }, []);

    async function getWorkspaces() {
        try {
            const response = await api.authGroups();
            setWorkspaces(response.data.groups);
        } catch (error) {
            redirectToAlert({
                target: "/profile",
                error,
            });
        }
    }

    if (isEmpty(group)) {
        redirectToAlert({
            target: "/profile",
            error: `Group ${groupName} doesn't exist`,
        });
        return <></>;
    }

    if (group.private) return <Navigate to={`/profile/user/${group.name}`} />;

    // Merge it with workspace info
    const workspace = workspaces.find((group) => group.name === groupName);

    if (isNil(workspace)) return <></>;

    if (
        !(
            workspace.admins.includes(auth.user.login) ||
            auth.hasCapability(Capability.manageUsers)
        )
    )
        return (
            <Navigate
                to={`/profile/group/${groupName}`}
                state={{
                    error: `Only group admins have access to group members management.`,
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
