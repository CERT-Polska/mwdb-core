import React, { useContext } from "react";
import { Link } from "react-router-dom";

import { faUsersCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { DateString, ShowIf } from "@mwdb-web/commons/ui";

function ProfileItem(props) {
    if (!props.value) return [];
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || props.value}</td>
        </tr>
    );
}

export default function ProfileSettings({ profile }) {
    const auth = useContext(AuthContext);
    const isCurrentUser = profile.login === auth.user.login;

    return (
        <div>
            <h4>Profile settings</h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <ProfileItem label="Login" value={profile.login} />
                    <ProfileItem label="E-mail" value={profile.email} />
                    <ProfileItem
                        label="Registered on"
                        value={profile.registered_on}
                    >
                        <DateString date={profile.registered_on} />
                    </ProfileItem>
                    <ProfileItem label="Last login" value={profile.logged_on}>
                        <DateString date={profile.logged_on} />
                    </ProfileItem>
                    <ProfileItem
                        label="Last password set"
                        value={profile.set_password_on}
                    >
                        <DateString date={profile.set_password_on} />
                    </ProfileItem>
                    <ProfileItem
                        label="Groups"
                        value={profile.groups && profile.groups.length}
                    >
                        {profile.groups &&
                            profile.groups
                                .filter((group) => !group.private)
                                .map((group) => (
                                    <Link to={`/settings/group/${group.name}`}>
                                        <span className="badge badge-secondary">
                                            {group.name}
                                        </span>
                                    </Link>
                                ))}
                    </ProfileItem>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <ShowIf condition={isCurrentUser}>
                        <Link
                            className="nav-link"
                            to="/settings/profile/capabilities"
                        >
                            Check your capabilities
                        </Link>
                        <Link
                            className="nav-link"
                            to="/settings/profile/api-keys"
                        >
                            Set up API keys
                        </Link>
                        <Link
                            className="nav-link"
                            to="/settings/profile/reset-password"
                        >
                            Reset password
                        </Link>
                    </ShowIf>
                    <Link
                        className="nav-link"
                        to={makeSearchLink(
                            "uploader",
                            profile.login,
                            false,
                            "/"
                        )}
                    >
                        Search for uploads
                    </Link>
                    <ShowIf
                        condition={auth.hasCapability(Capability.manageUsers)}
                    >
                        <Link
                            className="nav-link"
                            to={`/settings/admin/user/${profile.login}`}
                        >
                            <FontAwesomeIcon icon={faUsersCog} />
                            User settings
                        </Link>
                    </ShowIf>
                </li>
            </ul>
        </div>
    );
}
