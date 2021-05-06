import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, Redirect, useParams, useHistory } from "react-router-dom";

import { faUsersCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { GroupBadge, ShowIf, getErrorMessage } from "@mwdb-web/commons/ui";

function ProfileItem(props) {
    if (!props.value) return [];
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || props.value}</td>
        </tr>
    );
}

export default function ProfileGroup({ profile }) {
    const auth = useContext(AuthContext);
    const history = useHistory();
    const { group: groupName } = useParams();
    const [workspaces, setWorkspaces] = useState();

    async function updateWorkspaces() {
        try {
            const response = await api.authGroups();
            setWorkspaces(response.data["groups"]);
        } catch (error) {
            history.push({
                pathname: "/profile",
                state: {
                    error: getErrorMessage(error),
                },
            });
        }
    }

    const getWorkspaces = useCallback(updateWorkspaces, []);

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
    // Merge it with workspace info
    const workspace = workspaces.find((group) => group.name === groupName);

    if (group.private) return <Redirect to={`/profile/user/${group.name}`} />;

    return (
        <div>
            <h4>
                Group <span className="text-monospace">{groupName}</span>{" "}
                details
            </h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <ProfileItem label="Name" value={group.name} />
                    <ProfileItem
                        label="Group admins"
                        value={workspace && workspace.admins.length}
                    >
                        {workspace &&
                            workspace.admins.map((login) => (
                                <GroupBadge
                                    group={{
                                        name: login,
                                        private: true,
                                    }}
                                    clickable
                                />
                            ))}
                    </ProfileItem>
                    <ProfileItem
                        label="Members"
                        value={workspace && workspace.users.length}
                    >
                        {workspace &&
                            workspace.users.map((login) => (
                                <GroupBadge
                                    group={{
                                        name: login,
                                        private: true,
                                    }}
                                    clickable
                                />
                            ))}
                    </ProfileItem>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav flex-column">
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
                    <ShowIf
                        condition={auth.hasCapability(Capability.manageUsers)}
                    >
                        <Link className="nav-link" to={`/group/${group.name}`}>
                            <FontAwesomeIcon icon={faUsersCog} />
                            Group settings
                        </Link>
                    </ShowIf>
                </li>
            </ul>
        </div>
    );
}
