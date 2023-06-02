import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { api } from "@mwdb-web/commons/api";
import { GroupBadge } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { ProfileOutletContext } from "@mwdb-web/types/context";
import { Group } from "@mwdb-web/types/types";

export function ProfileGroups() {
    const { redirectToAlert } = useViewAlert();
    const { profile }: ProfileOutletContext = useOutletContext();
    const [workspaces, setWorkspaces] = useState<Group[]>([]);

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

    return (
        <div className="container">
            <h2>Role groups</h2>
            <p className="lead">
                Role groups are created to give additional superpowers and
                enable to share objects with broader community.
            </p>
            <table className="table table-bordered wrap-table">
                <tbody>
                    {profile.groups
                        .filter((group) => !group.private)
                        .filter(
                            (group) =>
                                !workspaces
                                    .map((workspace) => workspace.name)
                                    .includes(group.name)
                        )
                        .map((group) => (
                            <tr key={group.name}>
                                <td>
                                    <GroupBadge group={group} clickable />
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
            <h2>Workgroups</h2>
            <p className="lead">
                Workgroups allow you to share objects with other people you
                trust e.g. members of your organization.
            </p>
            <div>
                People from the same workgroup:
                <ul>
                    <li>
                        Can check what was uploaded by other workgroup members;
                    </li>
                    <li>
                        Share uploaded object by default when "All my groups"
                        option in Upload was used;
                    </li>
                    <li>
                        Optionally can do basic workgroup management when
                        workgroup administrator rights are given;
                    </li>
                </ul>
            </div>
            <table className="table table-bordered wrap-table">
                <tbody>
                    {workspaces
                        .filter((group) => !group.private)
                        .map((group) => (
                            <tr key={group.name}>
                                <td>
                                    <GroupBadge group={group} clickable />{" "}
                                    <small className="text-muted">
                                        {group.users.length} members
                                    </small>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
            <p>
                If you want to have a workgroup with someone, ask repository
                administrator to create one.
            </p>
        </div>
    );
}
