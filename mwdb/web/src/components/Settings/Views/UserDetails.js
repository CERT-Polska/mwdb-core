import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "@mwdb-web/commons/api";
import { DateString } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserItem from "./UserItem";

function EditableItem(props) {
    return (
        <span>
            {props.edit ? (
                <span>
                    {props.selective ? (
                        <select
                            value={props.item}
                            name={props.name}
                            onChange={(ev) => props.setItem(ev.target.value)}
                        >
                            {props.children}
                        </select>
                    ) : (
                        <input
                            type="text"
                            name={props.name}
                            className=".input-sm"
                            value={props.item}
                            onChange={(ev) => props.setItem(ev.target.value)}
                        />
                    )}
                    <span
                        className="float-right"
                        onClick={() => {
                            props.setItem(null);
                            props.setEdit(false);
                        }}
                        style={{ cursor: "pointer" }}
                    >
                        <FontAwesomeIcon className="float-right" icon="times" />
                    </span>
                    <span
                        className="float-right"
                        onClick={() => {
                            props.onSubmit();
                            props.setEdit(false);
                        }}
                        style={{ marginRight: "8px", cursor: "pointer" }}
                    >
                        <FontAwesomeIcon className="float-right" icon="save" />
                    </span>
                </span>
            ) : (
                <span>
                    <span
                        className={props.badge ? "badge badge-secondary" : ""}
                    >
                        {props.defaultValue}
                    </span>
                    <span
                        className="float-right"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            props.setEdit(true);
                            props.setItem(props.defaultValue);
                        }}
                    >
                        <FontAwesomeIcon className="float-right" icon="edit" />
                    </span>
                </span>
            )}
        </span>
    );
}

export default function UserDetails({ user, updateUser }) {
    const [email, setEmail] = useState(null);
    const [editEmail, setEditEmail] = useState(false);
    const [additionalInfo, setAdditionalInfo] = useState(null);
    const [editAdditionalInfo, setEditAdditionalInfo] = useState(false);
    const [feedQuality, setFeedQuality] = useState(null);
    const [editFeedQuality, setEditFeedQuality] = useState(false);

    async function handleSubmit() {
        try {
            await api.updateUser(
                user.login,
                email,
                additionalInfo,
                feedQuality
            );
            //set success
        } catch (error) {
            console.log(error);
        } finally {
            updateUser();
        }
    }

    if (!user) return [];
    console.log(email, additionalInfo, feedQuality);

    return (
        <div className="container">
            <h4>Account details</h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <UserItem label="Login" value={user.login} />
                    <UserItem label="E-mail">
                        <EditableItem
                            item={email}
                            setItem={setEmail}
                            edit={editEmail}
                            setEdit={setEditEmail}
                            name="email"
                            defaultValue={user.email}
                            onSubmit={handleSubmit}
                        />
                    </UserItem>
                    <UserItem label="Additional info">
                        <EditableItem
                            item={additionalInfo}
                            setItem={setAdditionalInfo}
                            edit={editAdditionalInfo}
                            setEdit={setEditAdditionalInfo}
                            name={"additional_info"}
                            defaultValue={user.additional_info}
                            onSubmit={handleSubmit}
                        />
                    </UserItem>
                    <UserItem label="Feed quality">
                        <EditableItem
                            item={feedQuality}
                            setItem={setFeedQuality}
                            edit={editFeedQuality}
                            setEdit={setEditFeedQuality}
                            name={"additional_info"}
                            defaultValue={user.feed_quality}
                            onSubmit={handleSubmit}
                            badge
                            selective
                        >
                            <option value="high">high</option>
                            <option value="low">low</option>
                        </EditableItem>
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
