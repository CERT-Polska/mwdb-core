import React, { Component } from "react";
import { Link } from "react-router-dom";
import { capabilitiesList } from "./Capabilities";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { View, DateString } from "@mwdb-web/commons/ui";

import ManageAPIKeys from "./ManageAPIKeys";

export default class UserProfile extends Component {
    state = {
        pressedRequestPassword: false,
        error: false,
    };

    static contextType = AuthContext;

    get capabilities() {
        return [
            ...this.state.profile.groups.reduce(
                (p, c) => new Set([...p, ...c.capabilities]),
                new Set()
            ),
        ];
    }

    inheritedFrom(cap) {
        return this.state.profile.groups
            .filter((c) => c.capabilities.includes(cap))
            .map((c) => c.name);
    }

    get groups() {
        return this.state.profile.groups.filter(
            (g) => g.name !== "public" && !g.private
        );
    }

    handleUpdate = async () => {
        try {
            let response = await api.getUserProfile(
                this.props.match.params.login
            );
            this.setState({
                profile: response.data,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    requestPasswordChange = async () => {
        try {
            await api.authRequestPasswordChange();
            this.setState({
                pressedRequestPassword: true,
                success:
                    "Password reset link has been sent to your e-mail address.",
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    componentDidMount() {
        this.handleUpdate();
    }

    componentDidUpdate(prevProps) {
        if (this.props.match.params.login !== prevProps.match.params.login) {
            this.handleUpdate();
        }
    }

    render() {
        if (!this.state.profile && !this.state.error) {
            return <div>Loading...</div>;
        }

        return (
            <View
                ident="userProfile"
                error={this.state.error}
                success={this.state.success}
                showIf={this.state.profile}
            >
                <table className="table table-striped table-bordered wrap-table">
                    <thead>
                        <tr className="d-flex">
                            <th key="key" className="col-2">
                                Attribute
                            </th>
                            <th key="value" className="col-10">
                                Value
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="d-flex">
                            <td className="col-2">Login</td>
                            <td className="col-10">
                                {this.state.profile.login}
                            </td>
                        </tr>
                        <tr className="d-flex">
                            <td className="col-2">E-mail</td>
                            <td className="col-10">
                                {this.state.profile.email}
                            </td>
                        </tr>
                        <tr className="d-flex">
                            <td className="col-2">Registered</td>
                            <td className="col-10">
                                <DateString
                                    date={this.state.profile.registered_on}
                                />
                            </td>
                        </tr>
                        <tr className="d-flex">
                            <td className="col-2">Last login</td>
                            <td className="col-10">
                                <DateString
                                    date={this.state.profile.logged_on}
                                />
                            </td>
                        </tr>
                        {this.context.user.login ===
                            this.state.profile.login && (
                            <tr className="d-flex">
                                <td className="col-2">Last password set</td>
                                <td className="col-10">
                                    <DateString
                                        date={
                                            this.state.profile.set_password_on
                                        }
                                    />
                                </td>
                            </tr>
                        )}
                        {this.state.profile.capabilities &&
                            this.capabilities.length > 0 && (
                                <tr className="d-flex">
                                    <td className="col-2">Capabilities</td>
                                    <td className="col-10">
                                        <ul className="table-ul">
                                            {this.capabilities.map((c) => (
                                                <li>
                                                    {capabilitiesList[c]}
                                                    (inherited from:{" "}
                                                    {this.inheritedFrom(c).join(
                                                        ", "
                                                    )}
                                                    )
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            )}
                        {this.state.profile.groups && this.groups.length > 0 && (
                            <tr className="d-flex">
                                <td className="col-2">Groups</td>
                                <td className="col-10">
                                    <ul className="table-ul">
                                        {this.groups.map((g) => (
                                            <li>{g.name}</li>
                                        ))}
                                    </ul>
                                </td>
                            </tr>
                        )}
                        <tr className="d-flex">
                            <td className="col-12" colspan="3">
                                {this.context.user.login ===
                                this.state.profile.login ? (
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={this.requestPasswordChange}
                                        disabled={
                                            this.state.pressedRequestPassword
                                        }
                                    >
                                        Request new password
                                    </button>
                                ) : (
                                    <Link
                                        to={makeSearchLink(
                                            "uploader",
                                            this.state.profile.login
                                        )}
                                    >
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                        >
                                            Search {this.state.profile.login}'s
                                            uploads
                                        </button>
                                    </Link>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
                {this.context.user.login === this.state.profile.login && (
                    <div>
                        <h4>API keys</h4>
                        <ManageAPIKeys
                            items={this.state.profile.api_keys}
                            userLogin={this.context.user.login}
                            onSuccess={(success) => {
                                this.handleUpdate();
                                this.setState({ success });
                            }}
                            onError={(error) => this.setState({ error })}
                        />
                    </div>
                )}
            </View>
        );
    }
}
