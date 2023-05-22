import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";

import { api } from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { PagedList, DateString, ConfirmationModal } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { User } from "@mwdb-web/types/types";

type ModalSpec = {
    action?: () => void;
    message?: string;
    buttonStyle?: string;
    confirmText?: string;
};

export function UsersPendingListView() {
    const viewAlert = useViewAlert();
    const { pendingUsers, getPendingUsers } = useContext(ConfigContext);
    const [activePage, setActivePage] = useState<number>(1);
    const [userFilter, setUserFilter] = useState<string>("");
    const [modalSpec, setModalSpec] = useState<ModalSpec>({});

    useEffect(() => {
        getPendingUsers();
    }, []);

    const query = userFilter.toLowerCase();
    const items = pendingUsers
        .filter(
            (user) =>
                user.login.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query)
        )
        .sort((userA, userB) => {
            const dateA = userA.requested_on
                ? new Date(userA.requested_on)
                : new Date(0);
            const dateB = userB.requested_on
                ? new Date(userB.requested_on)
                : new Date(0);
            return dateA.getTime() - dateB.getTime();
        });

    async function acceptUser(login: string) {
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

    async function rejectUser(login: string, mailNotification: boolean) {
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

    function selectAcceptUser(login: string) {
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

    function selectRejectUser(login: string, mailNotification: boolean) {
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

    function PendingUserItem(props: User) {
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
