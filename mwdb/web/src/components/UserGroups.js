import React, { Component } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View, HighlightText, ConfirmationModal } from "@mwdb-web/commons/ui";

class UserGroupRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            isRemoveModalOpen: false,
            removeUser: null,
        };
    }

    static contextType = AuthContext;

    _toggle() {
        this.setState({
            open: !this.state.open,
        });
    }

    removeMember = async (login) => {
        try {
            await api.removeGroupMember(this.props.group.name, login);
            this.props.groupUpdate();
            this.props.onSuccess("Member removed successfully");
        } catch (error) {
            this.props.onError(error);
        }
    };

    render() {
        return (
            <React.Fragment>
                <tr className="d-flex">
                    <th
                        className="col"
                        style={{ cursor: "pointer" }}
                        onClick={this._toggle.bind(this)}
                    >
                        <FontAwesomeIcon
                            icon={this.state.open ? "minus" : "plus"}
                            size="sm"
                        />{" "}
                        {this.context.isAdmin ? (
                            <Link to={`/group/${this.props.group.name}`}>
                                <HighlightText>
                                    {this.props.group.name}
                                </HighlightText>
                            </Link>
                        ) : (
                            <HighlightText>
                                {this.props.group.name}
                            </HighlightText>
                        )}
                    </th>
                </tr>
                {this.state.open &&
                    this.props.group.users.sort().map((c, idx) => (
                        <tr className="nested d-flex">
                            <td className="col">
                                <Link key={idx} to={`profile/${c}`}>
                                    {c}
                                </Link>
                                {this.props.group.admins.includes(c) &&
                                    " (admin)"}
                            </td>
                            {this.props.groupAdmin && (
                                <td className="col">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-danger"
                                        onClick={() =>
                                            this.setState({
                                                isRemoveModalOpen: true,
                                                removeUser: c,
                                            })
                                        }
                                    >
                                        Remove member
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                <ConfirmationModal
                    isOpen={this.state.isRemoveModalOpen}
                    onRequestClose={() =>
                        this.setState({
                            isRemoveModalOpen: false,
                            removeUser: null,
                        })
                    }
                    onConfirm={() => {
                        this.removeMember(this.state.removeUser);
                        this.setState({
                            isRemoveModalOpen: false,
                            removeUser: null,
                        });
                    }}
                    message={`Are you sure to delete ${this.state.removeUser} user from group?`}
                />
            </React.Fragment>
        );
    }
}

export default class UserGroups extends Component {
    state = {
        groups: [],
        error: null,
        success: null,
    };

    static contextType = AuthContext;

    updateUserGroups = async () => {
        try {
            let response = await api.authGroups();
            this.setState({
                groups: response.data.groups,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    componentDidMount() {
        this.updateUserGroups();
    }

    handleError = (error) => {
        this.setState({ error });
    };

    handleSuccess = (success) => {
        this.setState({ success, error: null });
    };

    render() {
        const userGroupItems = this.state.groups
            .sort((a, b) => a.name > b.name)
            .map((v) => (
                <UserGroupRow
                    key={v}
                    group={v}
                    groupUpdate={this.updateUserGroups}
                    onError={this.handleError}
                    onSuccess={this.handleSuccess}
                    isAdmin={this.context.isAdmin}
                    groupAdmin={
                        this.context.isAdmin ||
                        v.admins.includes(this.context.user.login)
                    }
                />
            ));

        return (
            <div className="container">
                <View error={this.state.error} success={this.state.success}>
                    {this.state.groups.length ? (
                        <table
                            className="table table-bordered table-striped"
                            style={{ border: "1px" }}
                        >
                            <thead>
                                <tr className="d-flex">
                                    <th className="col">Group name</th>
                                    {(this.context.isAdmin ||
                                        this.state.groups.some((group) =>
                                            group.admins.includes(
                                                this.context.user.login
                                            )
                                        )) && <th className="col">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>{userGroupItems}</tbody>
                        </table>
                    ) : (
                        <h4 className="text-center">
                            You are currently not a member of any group.
                        </h4>
                    )}
                </View>
            </div>
        );
    }
}
