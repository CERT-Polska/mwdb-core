import React from "react";
import { Link } from "react-router-dom";
import { DateString } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import UserItem from "./UserItem";

export default function UserDetails({ user }) {
    if (!user) return [];

    return (
        <div className="container">
            <h4>Account details</h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <UserItem label="Login" value={user.login} />
                    <UserItem label="E-mail" value={user.email} />
                    <UserItem
                        label="Additional info"
                        value={user.additional_info}
                    />
                    <UserItem label="Feed quality" value={user.feed_quality}>
                        <span className="badge badge-secondary">
                            {user.feed_quality}
                        </span>
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
                                .map((group) => (
                                    <Link to={`/profile/group/${group.name}`}>
                                        <span className="badge badge-secondary">
                                            {group.name}
                                        </span>
                                    </Link>
                                ))}
                    </UserItem>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <Link
                        className="nav-link"
                        to={`/admin/user/${user.login}/manage`}
                    >
                        Manage account
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/admin/user/${user.login}/capabilities`}
                    >
                        Modify capabilities
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/admin/user/${user.login}/api-keys`}
                    >
                        Manage API keys
                    </Link>
                    <Link className="nav-link" to="/profile/reset-password">
                        Change password
                    </Link>
                    <Link
                        className="nav-link"
                        to={makeSearchLink("uploader", user.login, false, "/")}
                    >
                        Search for uploads
                    </Link>
                </li>
            </ul>
        </div>
    );
}
