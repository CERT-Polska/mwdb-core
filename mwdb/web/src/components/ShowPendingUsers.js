import React, { Component } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import {
    PagedList,
    View,
    DateString,
    ConfirmationModal,
} from "@mwdb-web/commons/ui";

class ShowPendingUsers extends Component {
    state = {
        users: [],
        activePage: 1,
        loginFilter: "",
        isModalOpen: false,
        modalSpec: {},
    };

    handlePageChange = (pageNumber) => {
        this.setState({ activePage: pageNumber });
    };

    handleFilterChange = (ev) => {
        const target = ev.target;
        this.setState({ loginFilter: target.value, activePage: 1 });
    };

    handleUpdate = async () => {
        this.setState({ loginFilter: "", activePage: 1 });
        try {
            let response = await api.getPendingUsers();
            this.setState({ users: response.data.users });
        } catch (error) {
            this.setState({ error });
        }
    };

    componentDidMount() {
        this.handleUpdate();
    }

    handleAcceptUser = (login) => {
        this.setState({
            isModalOpen: true,
            modalSpec: {
                message: `Register an account ${login}?`,
                action: () => {
                    this.setState({ isModalOpen: false });
                    this.acceptUser(login);
                },
                buttonStyle: "bg-success",
                confirmText: "Accept",
            },
        });
    };

    handleRejectUser = (login, notification) => {
        let message = notification
            ? `Reject an account ${login}?`
            : `Reject an account ${login} without email notification?`;

        this.setState({
            isModalOpen: true,
            modalSpec: {
                message: message,
                action: () => {
                    this.setState({ isModalOpen: false });
                    this.rejectUser(login, notification);
                },
                confirmText: "Reject",
            },
        });
    };

    acceptUser = async (login) => {
        try {
            await api.acceptPendingUser(login);
            this.setState({
                success: "Successfully accepted user",
                error: null,
            });
            this.handleUpdate();
        } catch (error) {
            this.setState({ error });
        }
    };

    rejectUser = async (login, notification) => {
        try {
            await api.rejectPendingUser(login, notification);
            this.setState({
                success: "Successfully rejected user",
                error: null,
            });
            this.handleUpdate();
        } catch (error) {
            this.setState({ error });
        }
    };

    get items() {
        let propagatedProps = {
            acceptUser: this.handleAcceptUser,
            rejectUser: this.handleRejectUser,
        };
        return this.state.users
            .filter((f) =>
                f.login
                    .toLowerCase()
                    .startsWith(this.state.loginFilter.toLowerCase())
            )
            .map((item) => ({ ...propagatedProps, ...item }))
            .sort((a, b) => {
                if (new Date(a.requested_on) < new Date(b.requested_on))
                    return -1;
                if (new Date(a.requested_on) > new Date(b.requested_on))
                    return 1;
                if (a.login > b.login) return 1;
                if (a.login < b.login) return -1;
                return 0;
            });
    }

    render() {
        const tableOverflow = {
            overflow: "visible",
        };

        return (
            <View
                fluid
                ident="showPendingUsers"
                success={this.state.success}
                error={this.state.error}
            >
                <ConfirmationModal
                    isOpen={this.state.isModalOpen}
                    onRequestClose={() => this.setState({ isModalOpen: false })}
                    onConfirm={this.state.modalSpec.action}
                    message={this.state.modalSpec.message}
                    confirmText={this.state.modalSpec.confirmText}
                    buttonStyle={this.state.modalSpec.buttonStyle}
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
                    items={this.items.slice(
                        (this.state.activePage - 1) * 10,
                        this.state.activePage * 10
                    )}
                    itemCount={this.items.length}
                    activePage={this.state.activePage}
                    filterValue={this.state.loginFilter}
                    tableStyle={tableOverflow}
                    onPageChange={this.handlePageChange}
                    onFilterChange={this.handleFilterChange}
                />
            </View>
        );
    }
}

export function UserLink(props) {
    return <Link to={`/user/${props.login}`}>{props.login}</Link>;
}

function PendingUserItem(props) {
    return (
        <tr>
            <td style={{ textAlign: "left" }}>
                <UserLink {...props} />
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
                    onClick={() => props.acceptUser(props.login)}
                >
                    Accept
                </button>
                <div className="btn-group">
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => props.rejectUser(props.login, true)}
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
                            onClick={() => props.rejectUser(props.login, false)}
                        >
                            Reject without email
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    );
}

export default ShowPendingUsers;
