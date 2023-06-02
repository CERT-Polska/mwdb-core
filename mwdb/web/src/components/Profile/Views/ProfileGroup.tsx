import { useContext, useEffect, useState } from "react";
import { Link, Navigate, useParams, useOutletContext } from "react-router-dom";
import { isEmpty } from "lodash";

import { faUsersCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { GroupBadge, ShowIf } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { Capability } from "@mwdb-web/types/types";
import { ProfileItem } from "../common/ProfileItem";
import { ProfileOutletContext } from "@mwdb-web/types/context";
import { Group } from "@mwdb-web/types/types";

export function ProfileGroup() {
    const auth = useContext(AuthContext);
    const { profile }: ProfileOutletContext = useOutletContext();
    const { redirectToAlert } = useViewAlert();
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
    // Merge it with workspace info
    const workspace = workspaces.find((group) => group.name === groupName);

    if (group.private) return <Navigate to={`/profile/user/${group.name}`} />;

    return (
        <div className="container">
            <h4>
                Group <span className="text-monospace">{groupName}</span>{" "}
                details
            </h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <ProfileItem label="Name" value={group.name} />
                    <ProfileItem
                        label="Group admins"
                        value={workspace?.admins.length}
                    >
                        <>
                            {workspace &&
                                workspace.admins
                                    .sort((userA: string, userB: string) =>
                                        userA.localeCompare(userB)
                                    )
                                    .map((login: string, index: number) => (
                                        <GroupBadge
                                            key={index}
                                            group={{
                                                name: login,
                                                private: true,
                                            }}
                                            clickable
                                        />
                                    ))}
                        </>
                    </ProfileItem>
                    <ProfileItem
                        label="Members"
                        value={workspace && workspace.users.length}
                    >
                        <>
                            {workspace &&
                                workspace.users
                                    .sort((userA: string, userB: string) =>
                                        userA.localeCompare(userB)
                                    )
                                    .map((login: string, index: number) => (
                                        <GroupBadge
                                            key={index}
                                            group={{
                                                name: login,
                                                private: true,
                                            }}
                                            clickable
                                        />
                                    ))}
                        </>
                    </ProfileItem>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav flex-column">
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
                    {workspace && (
                        <ShowIf
                            condition={
                                workspace.admins.includes(auth.user.login) ||
                                auth.hasCapability(Capability.manageUsers)
                            }
                        >
                            <Link
                                className="nav-link"
                                to={`/profile/group/${group.name}/members`}
                            >
                                <FontAwesomeIcon icon={faUsersCog} />
                                Members settings
                            </Link>
                        </ShowIf>
                    )}

                    <ShowIf
                        condition={auth.hasCapability(Capability.manageUsers)}
                    >
                        <Link
                            className="nav-link"
                            to={`/settings/group/${group.name}`}
                        >
                            <FontAwesomeIcon icon={faUsersCog} />
                            Group settings
                        </Link>
                    </ShowIf>
                </li>
            </ul>
        </div>
    );
}
