import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";

import { faUserCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { fromPlugin } from "@mwdb-web/commons/extensions";
import { DateString, ShowIf, getErrorMessage } from "@mwdb-web/commons/ui";

export let capabilitiesList = {
    manage_users: "Managing users and groups (system administration)",
    share_queried_objects: "Query for all objects in system",
    access_all_objects: "Has access to all new uploaded objects into system",
    sharing_objects: "Can share objects with all groups in system",
    adding_tags: "Can add tags",
    removing_tags: "Can remove tags",
    adding_comments: "Can add comments",
    removing_comments: "Can remove (all) comments",
    adding_parents: "Can specify parent of uploaded object",
    reading_all_attributes:
        "Has access to all attributes of object (including hidden)",
    adding_all_attributes: "Can add all attributes to object",
    managing_attributes: "Can define new attributes and manage them",
    removing_attributes: "Can remove attribute from objects",
    adding_configs: "Can upload configs",
    adding_blobs: "Can upload text blobs",
    unlimited_requests: "API requests are not rate-limited for this group",
    removing_objects: "Can remove objects",
};

for (let extraCapabilities of fromPlugin("capabilities")) {
    capabilitiesList = { ...capabilitiesList, ...extraCapabilities };
}


function ProfileItem(props) {
    if(!props.value)
        return [];
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">
                {props.children || props.value}
            </td>
        </tr>
    )
}

function CapabilitiesTable({profile}) {
    if(!profile.capabilities)
        return [];
    return (
        <table className="table table-bordered wrap-table">
            <tbody>
            {
                profile.capabilities.sort().map(cap => (
                    <tr>
                        <th className="col-1">
                            <span className="badge badge-success">
                                {cap}
                            </span>
                        </th>
                        <td className="col">
                            <div>
                                { capabilitiesList[cap] || "(no description)" }
                            </div>
                            <div>
                                {
                                    profile.groups.filter(
                                        group => group.capabilities.includes(cap)
                                    ).map(
                                        group => (
                                            <span className={`badge badge-${
                                                group.private ? "primary" : "secondary"
                                            }`}>
                                                {group.name}
                                            </span>
                                        )
                                    )
                                }
                            </div>
                        </td>
                    </tr>
                ))
            }
            </tbody>
        </table>
    )
}

export default function UserProfile(props) {
    const auth = useContext(AuthContext);
    const history = useHistory();
    const user = useParams().user || auth.user.login;
    const isCurrentUser = user === auth.user.login;
    const [ profile, setProfile ] = useState();

    async function updateProfile() {
        try {
            const response = await api.getUserProfile(
                user
            );
            setProfile(response.data);
        } catch (error) {
            history.push({
                pathname: "/settings/profile",
                state: {error: getErrorMessage(error)}
            })
        }
    }

    const getProfile = useCallback(updateProfile, [user]);

    useEffect(() => {
        getProfile();
    }, [getProfile]);

    if(!profile)
        return [];

    return (
        <div>
            <h4>Account details</h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <ProfileItem label="Login" value={profile.login}/>
                    <ProfileItem label="E-mail" value={profile.email}/>
                    <ProfileItem label="Registered on" value={profile.registered_on}>
                        <DateString date={profile.registered_on} />
                    </ProfileItem>
                    <ProfileItem label="Last login" value={profile.logged_on}>
                        <DateString date={profile.logged_on} />
                    </ProfileItem>
                    <ProfileItem label="Last password set" value={profile.set_password_on}>
                        <DateString date={profile.set_password_on} />
                    </ProfileItem>
                    <ProfileItem label="Groups" value={profile.groups && profile.groups.length}>
                        {
                            profile.groups && profile.groups.filter(group => !group.private).map(
                                group => (
                                    <span className="badge badge-secondary">
                                        {group.name}
                                    </span>
                                )
                            )
                        }
                    </ProfileItem>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <ShowIf condition={isCurrentUser}>
                        <Link className="nav-link" to="/settings/capabilities">
                            Check your capabilities
                        </Link>
                        <Link className="nav-link" to="/settings/reset_password">
                            Request new password
                        </Link>
                    </ShowIf>
                    <ShowIf condition={auth.hasCapability("manage_users")}>
                        <Link className="nav-link" to="/settings/admin/user/">
                            <FontAwesomeIcon icon={faUserCog} />
                            User settings
                        </Link>
                    </ShowIf>
                </li>
            </ul>
        </div>
    )
}