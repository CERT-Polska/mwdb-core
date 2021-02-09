import React, { Component } from "react";
import { Link } from "react-router-dom";
import { capabilitiesList } from "./Capabilities";
import { GroupLink } from "./ShowGroups";

import _ from "lodash";
import api from "@mwdb-web/commons/api";
import { View, MemberList, DateString } from "@mwdb-web/commons/ui";
import ManageAPIKeys from "./ManageAPIKeys";

export let GroupMemberList = (props) => (
    <MemberList nameKey="name" itemLinkClass={GroupLink} {...props} />
);

class UserUpdate extends Component {
    state = {
        loaded: false,
        email: "",
        additional_info: "",
        disabled: false,
        error: null,
        success: null,
        setPasswordURL: null,
        apiToken: null,
        groups: [],
        allGroups: [],
        feed_quality: "",
        api_keys: [],
    };

    get capabilities() {
        return [
            ...this.state.groups.reduce(
                (p, c) => new Set([...p, ...c.capabilities]),
                new Set()
            ),
        ];
    }

    inheritedFrom(cap) {
        return this.state.groups
            .filter((c) => c.capabilities.includes(cap))
            .map((c) => c.name);
    }

    async handleUpdate() {
        let login = this.props.match.params.login;
        try {
            let response = await api.getUser(login);
            let data = {
                email: response.data.email,
                additional_info: response.data.additional_info,
            };

            this.setState({
                loaded: true,
                error: null,
                setPasswordURL: null,
                disabled: response.data.disabled,
                groups: response.data.groups,
                requested_on: response.data.requested_on,
                registered_on: response.data.registered_on,
                registrar_login: response.data.registrar_login,
                logged_on: response.data.logged_on,
                set_password_on: response.data.set_password_on,
                feed_quality: response.data.feed_quality,
                api_keys: response.data.api_keys,
                ..._.fromPairs(
                    _.toPairs(data).reduce(
                        (p, c) => p.concat([c], [["original_" + c[0], c[1]]]),
                        []
                    )
                ),
            });
        } catch (error) {
            this.setState({ error: error, loaded: true });
        }
    }

    handleGenerateApiToken = async (event) => {
        event.preventDefault();
        try {
            let login = this.props.match.params.login;
            let response = await api.generateApiToken(login);
            this.setState({
                apiToken: response.data.token,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    handlePasswordSet = async (event) => {
        event.preventDefault();
        try {
            let getURLFromToken = (token) =>
                encodeURI(
                    `${window.location.protocol}//${window.location.host}/setpasswd/${token}`
                );
            let login = this.props.match.params.login;
            let response = await api.generateSetPasswordToken(login);
            this.setState({
                setPasswordURL: getURLFromToken(response.data.token),
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    async componentDidMount() {
        try {
            let response = await api.getGroups();
            this.setState({
                allGroups: response.data.groups,
            });
            this.handleUpdate();
        } catch (error) {
            this.setState({ error });
        }
    }

    handleInputChange = (event) => {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value,
        });
    };

    setDisabledState = async (ban) => {
        try {
            await api.setUserDisabled(this.props.match.params.login, ban);
            this.handleUpdate();
            this.setState({
                success: "Successfuly updated user",
                error: null,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    handleBan = () => this.setDisabledState(true);
    handleUnban = () => this.setDisabledState(false);

    addMember = async (group) => {
        try {
            await api.addGroupMember(group, this.props.match.params.login);
            this.handleUpdate();
            this.setState({
                success: "Successfuly added member",
                error: null,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    removeMember = async (group) => {
        try {
            await api.removeGroupMember(group, this.props.match.params.login);
            this.handleUpdate();
            this.setState({
                success: "Successfuly removed member",
                error: null,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    handleSubmit = async (event) => {
        event.preventDefault();
        let login = this.props.match.params.login;
        try {
            await api.updateUser(
                login,
                this.state.email,
                this.state.additional_info,
                this.state.feed_quality
            );
            this.setState({
                success: "Successfuly updated user",
                error: null,
            });
            this.handleUpdate();
        } catch (error) {
            this.setState({ error });
        }
    };

    get items() {
        return this.state.groups.filter(
            (x) =>
                x.name !== "public" && x.name !== this.props.match.params.login
        );
    }

    itemsFromDifferentGroups() {
        return this.state.allGroups.filter(
            (g) =>
                !this.state.groups.map((x) => x.name).includes(g.name) &&
                !g.private &&
                g.name !== "public"
        );
    }

    render() {
        let changeNotifier = (field) => {
            return this.state[field] !== this.state["original_" + field] ? (
                <span style={{ color: "red" }}>*</span>
            ) : (
                <span />
            );
        };
        if (!this.state.loaded) {
            return <div>Loading...</div>;
        }
        return (
            <View
                ident="userUpdate"
                error={this.state.error}
                success={this.state.success}
            >
                <h2>Set user {this.props.match.params.login} info</h2>
                <form onSubmit={this.handleSubmit}>
                    <table className="table table-striped table-bordered wrap-table">
                        <thead>
                            <tr>
                                <th key="key">Attribute</th>
                                <th key="value">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{changeNotifier("email")}E-mail</td>
                                <td>
                                    <input
                                        type="email"
                                        name="email"
                                        value={this.state.email}
                                        onChange={this.handleInputChange}
                                        className="form-control"
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {changeNotifier("additional_info")}
                                    Additional info
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        name="additional_info"
                                        value={this.state.additional_info}
                                        onChange={this.handleInputChange}
                                        className="form-control"
                                        required
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {changeNotifier("feed_quality")}Feed quality
                                </td>
                                <td>
                                    <select
                                        onChange={this.handleInputChange}
                                        name="feed_quality"
                                        value={this.state.feed_quality}
                                        className="form-control"
                                    >
                                        <option value="high">high</option>
                                        <option value="low">low</option>
                                    </select>
                                    <p className="text-muted">
                                        More resources may be dedicated to
                                        analyze samples which are uploaded by
                                        users having high feed quality. Low feed
                                        quality level is meant to be set for
                                        accounts that indicate highly automated
                                        activity (bots).
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td>Requested</td>
                                <td>
                                    {
                                        <DateString
                                            date={this.state.requested_on}
                                        />
                                    }
                                </td>
                            </tr>
                            <tr>
                                <td>Registered</td>
                                <td>
                                    {
                                        <DateString
                                            date={this.state.registered_on}
                                        />
                                    }{" "}
                                    (by {this.state.registrar_login || "nobody"}
                                    )
                                </td>
                            </tr>
                            <tr>
                                <td>Last login</td>
                                <td>
                                    {<DateString date={this.state.logged_on} />}
                                </td>
                            </tr>
                            <tr>
                                <td>Last password set</td>
                                <td>
                                    {
                                        <DateString
                                            date={this.state.set_password_on}
                                        />
                                    }
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="form-group">
                        {this.capabilities.length > 0 ? (
                            <React.Fragment>
                                <label>User is allowed to:</label>
                                <ul>
                                    {this.capabilities.map((c) => (
                                        <li>
                                            {capabilitiesList[c]} (inherited
                                            from:{" "}
                                            {this.inheritedFrom(c).join(", ")})
                                        </li>
                                    ))}
                                </ul>
                            </React.Fragment>
                        ) : (
                            []
                        )}
                        <Link to={`/group/${this.props.match.params.login}`}>
                            <button type="button" className="btn btn-primary">
                                Set user permissions
                            </button>
                        </Link>
                    </div>

                    <h4>Groups</h4>

                    <GroupMemberList
                        items={this.items}
                        addMember={this.addMember}
                        removeMember={this.removeMember}
                        newMemberItems={this.itemsFromDifferentGroups()}
                        userName={this.props.match.params.login}
                    />

                    <h4>API keys</h4>

                    <ManageAPIKeys
                        items={this.state.api_keys}
                        userLogin={this.props.match.params.login}
                        onSuccess={(success) => {
                            this.handleUpdate();
                            this.setState({ success });
                        }}
                        onError={(error) => this.setState({ error })}
                    />

                    {this.state.disabled ? (
                        <div className="form-hint" style={{ color: "red" }}>
                            User is banned.
                        </div>
                    ) : (
                        []
                    )}
                    <div className="btn-group" role="group">
                        <input
                            type="submit"
                            value="Submit"
                            className="btn btn-primary"
                        />
                        <button
                            onClick={this.handlePasswordSet}
                            type="button"
                            className="btn btn-primary"
                        >
                            Change password
                        </button>
                        {this.state.disabled ? (
                            <button
                                onClick={this.handleUnban}
                                type="button"
                                className="btn btn-success align-right"
                            >
                                Unblock
                            </button>
                        ) : (
                            <button
                                onClick={this.handleBan}
                                type="button"
                                className="btn btn-danger align-right"
                            >
                                Block
                            </button>
                        )}
                    </div>
                    {this.state.setPasswordURL ? (
                        <div className="form-group mt-3">
                            <label>
                                Send the link below to the user to let him set
                                the password.
                            </label>
                            <textarea readOnly className="form-control">
                                {this.state.setPasswordURL}
                            </textarea>
                        </div>
                    ) : (
                        []
                    )}
                </form>
            </View>
        );
    }
}

export default UserUpdate;
