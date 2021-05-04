import React, { useState, useReducer } from "react";
import { Link, useHistory } from "react-router-dom";
import api from "@mwdb-web/commons/api";
import {
    DateString,
    getErrorMessage,
    ConfirmationModal,
} from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const initialState = {
    email: null,
    additionalInfo: null,
    feedQuality: null,
};

function userItemReducer(state, action) {
    switch (action.type) {
        case "email":
            return { email: action.payload };
        case "additionalInfo":
            return { additionalInfo: action.payload };
        case "feedQuality":
            return { feedQuality: action.payload };
        case "reset":
            return initialState;
        default:
            return state;
    }
}

function EditableItem(props) {
    const [state, dispatch] = useReducer(userItemReducer, initialState);
    const [edit, setEdit] = useState(false);
    return (
        <span>
            {edit ? (
                <div className="input-group">
                    {props.selective ? (
                        <select
                            className="form-control"
                            value={state.feedQuality}
                            name={state[props.name]}
                            onChange={(ev) =>
                                dispatch({
                                    type: props.name,
                                    payload: ev.target.value,
                                })
                            }
                        >
                            {props.children}
                        </select>
                    ) : (
                        <input
                            type={props.name === "email" ? "email" : "text"}
                            name={props.name}
                            className="form-control"
                            value={state[props.name]}
                            onChange={(ev) =>
                                dispatch({
                                    type: props.name,
                                    payload: ev.target.value,
                                })
                            }
                        />
                    )}
                    <div className="input-group-append">
                        <button
                            className="btn btn-outline-success"
                            onClick={() => {
                                props.onSubmit(
                                    state.email,
                                    state.additionalInfo,
                                    state.feedQuality
                                );
                                setEdit(false);
                            }}
                        >
                            <small>Save </small>
                            <FontAwesomeIcon icon="save" />
                        </button>
                        <button
                            className="btn btn-outline-danger"
                            onClick={() => {
                                dispatch({
                                    type: "reset",
                                    payload: initialState,
                                });
                                setEdit(false);
                            }}
                        >
                            <small>Cancel </small>
                            <FontAwesomeIcon icon="times" />
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <span
                        className={
                            props.badge
                                ? "badge badge-secondary align-middle"
                                : "align-middle"
                        }
                    >
                        {props.defaultValue}
                    </span>
                    <button
                        className="float-right align-middle btn shadow-none"
                        style={{ cursor: "pointer" }}
                        onClick={(ev) => {
                            ev.preventDefault();
                            setEdit(true);
                            dispatch({
                                type: props.name,
                                payload: props.defaultValue,
                            });
                        }}
                    >
                        <small className="text-muted">Edit </small>
                        <FontAwesomeIcon icon="edit" />
                    </button>
                </div>
            )}
        </span>
    );
}

function UserItem(props) {
    let value = props.value ? props.value : "never";
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || value}</td>
        </tr>
    );
}

export default function UserDetails({ user, getUser }) {
    const history = useHistory();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] = useState(false);

    async function handleSubmit(email, additionalInfo, feedQuality) {
        try {
            await api.updateUser(
                user.login,
                email,
                additionalInfo,
                feedQuality
            );
        } catch (error) {
            history.push({
                pathname: `/admin/user/${user.login}`,
                state: { error: getErrorMessage(error) },
            });
        } finally {
            getUser();
        }
    }

    async function setDisabledState(ban) {
        try {
            setDeleteModalDisabled(true);
            await api.setUserDisabled(user.login, ban);
        } catch (error) {
            history.push({
                pathname: `/admin/user/${user.login}`,
                state: { error: getErrorMessage(error) },
            });
        } finally {
            getUser();
        }
    }

    async function handleRemoveUser() {
        try {
            setDeleteModalDisabled(true);
            await api.removeUser(user.login);
            history.push({
                pathname: `/admin/users/`,
                state: { success: "User has been successfully removed" },
            });
        } catch (error) {
            history.push({
                pathname: `/admin/user/${user.login}`,
                state: { error: getErrorMessage(error) },
            });
            setDeleteModalDisabled(false);
        }
    }

    if (!user) return [];

    return (
        <div className="container">
            <h4>Account details</h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <UserItem label="Login" value={user.login} />
                    <UserItem label="E-mail">
                        <EditableItem
                            name="email"
                            defaultValue={user.email}
                            onSubmit={handleSubmit}
                        />
                    </UserItem>
                    <UserItem label="Additional info">
                        <EditableItem
                            name="additionalInfo"
                            defaultValue={user.additional_info}
                            onSubmit={handleSubmit}
                        />
                    </UserItem>
                    <UserItem label="Feed quality">
                        <EditableItem
                            name="feedQuality"
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
                                    <Link to={`/admin/group/${group.name}`}>
                                        <span className="badge badge-secondary">
                                            {group.name}
                                        </span>
                                    </Link>
                                ))}
                    </UserItem>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav">
                <li className="nav-item">
                    <Link
                        className="nav-link"
                        to={makeSearchLink("uploader", user.login, false, "/")}
                    >
                        Search for uploads
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/admin/user/${user.login}/groups`}
                    >
                        Show user groups
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/admin/user/${user.login}/capabilities`}
                    >
                        Check user capabilities
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/admin/user/${user.login}/api-keys`}
                    >
                        Manage API keys
                    </Link>
                    <Link
                        className="nav-link"
                        to={`/admin/user/${user.login}/password`}
                    >
                        Change password
                    </Link>
                    {user.disabled ? (
                        <a
                            href="#block-user"
                            className="nav-link text-danger"
                            onClick={() => setDisabledState(false)}
                        >
                            <FontAwesomeIcon icon="ban" />
                            Unblock user
                        </a>
                    ) : (
                        <a
                            href="#block-user"
                            className="nav-link text-danger"
                            onClick={() => setDisabledState(true)}
                        >
                            <FontAwesomeIcon icon="ban" />
                            Block user
                        </a>
                    )}
                    <a
                        href="#remove-user"
                        className="nav-link text-danger"
                        onClick={() => setDeleteModalOpen(true)}
                    >
                        <FontAwesomeIcon icon="trash" />
                        Remove user
                    </a>
                </li>
            </ul>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                disabled={isDeleteModalDisabled}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={handleRemoveUser}
                message={`Are tou sure you want to delete ${user.login} from mwdb`}
                buttonStyle="btn-danger"
            />
        </div>
    );
}
