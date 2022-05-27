import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import {
    PagedList,
    DateString,
    ConfirmationModal,
    useViewAlert,
} from "@mwdb-web/commons/ui";

export default function UsersPendingList() {
    const viewAlert = useViewAlert();
    const { pendingUsers, getPendingUsers } = useContext(ConfigContext);
    const [activePage, setActivePage] = useState(1);
    const [userFilter, setUserFilter] = useState("");
    const [modalSpec, setModalSpec] = useState({});

    useEffect(() => {
        getPendingUsers();
    }, [getPendingUsers]);

    const query = userFilter.toLowerCase();
    const items = pendingUsers
        .filter(
            (user) =>
                user.login.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
        )
        .sort(
            (userA, userB) =>
                new Date(userA["requested_on"]) -
                new Date(userB["requested_on"])
        );

    async function acceptUser(login) {
        try {
            await api.acceptPendingUser(login);
            viewAlert.setAlert({
                success: `User ${login} successfully accepted.`,
            });
            await getPendingUsers();
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function rejectUser(login, mailNotification) {
        try {
            await api.rejectPendingUser(login, mailNotification);
            viewAlert.setAlert({
                success: `User ${login} successfully rejected.`,
            });
            await getPendingUsers();
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    function selectAcceptUser(login) {
        setModalSpec({
            message: `Register an account ${login}?`,
            action: () => {
                setModalSpec({});
                acceptUser(login);
            },
            buttonStyle: "bg-success",
            confirmText: "Accept",
        });
    }

    function selectRejectUser(login, mailNotification) {
        const message = mailNotification
            ? `Reject an account ${login}?`
            : `Reject an account ${login} without email notification?`;

        setModalSpec({
            message: message,
            action: () => {
                setModalSpec({});
                rejectUser(login, mailNotification);
            },
            confirmText: "Reject",
        });
    }

    function PendingUserItem(props) {
        return (
            <tr>
                <td>
                    <Link to={`/settings/user/${props.login}`}>
                        {props.login}
                    </Link>
                </td>
                <td>
                    <a href={`mailto:${props.email}`}>{props.email}</a>
                </td>
                <td>{props.additional_info}</td>
                <td>
                    <DateString date={props.requested_on} />
                </td>
                <td>
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => selectAcceptUser(props.login)}
                    >
                        Accept
                    </button>
                    <div className="btn-group">
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => selectRejectUser(props.login, true)}
                        >
                            Reject
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger dropdown-toggle dropdown-toggle-split"
                            data-toggle="dropdown"
                        >
                            <span className="sr-only">Toggle Dropdown</span>
                        </button>
                        <div className="dropdown-menu dropdown-menu-right">
                            <div
                                className="dropdown-item"
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                    selectRejectUser(props.login, false)
                                }
                            >
                                Reject without email
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <div className="container">
            <ConfirmationModal
                isOpen={!!modalSpec.action}
                onRequestClose={() => setModalSpec({})}
                onConfirm={modalSpec.action}
                message={modalSpec.message}
                confirmText={modalSpec.confirmText}
                buttonStyle={modalSpec.buttonStyle}
            />
            <PagedList
                listItem={PendingUserItem}
                columnNames={[
                    "Login",
                    "E-mail",
                    "Additional info",
                    "Requested on",
                    "Actions",
                ]}
                items={items.slice((activePage - 1) * 10, activePage * 10)}
                itemCount={items.length}
                activePage={activePage}
                filterValue={userFilter}
                onPageChange={(pageNumber) => setActivePage(pageNumber)}
                onFilterChange={(ev) => {
                    setUserFilter(ev.target.value);
                    setActivePage(1);
                }}
            />
        </div>
    );
}
