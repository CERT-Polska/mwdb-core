import React, { Component } from "react";
import Capabilities from "./Capabilities";
import { UserLink } from "./ShowUsers";

import _ from "lodash";

import api from "@mwdb-web/commons/api";
import { Alert, MemberList } from "@mwdb-web/commons/ui";

export let GroupMemberList = (props) => (
    <MemberList nameKey="login" itemLinkClass={UserLink} {...props} />
);

export default class GroupUpdate extends Component {
    state = {
        error: null,
        loginFilter: "",
        users: [],
        admins: [],
        capabilities: [],
        success: null,
        allUsers: [],
        name: "",
        dirty: false,
    };

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props) this.doUpdate();
    }

    isGroupImmutable() {
        return this.props.match.params.name === "public" || this.state.private;
    }

    async doUpdate() {
        try {
            let response = await api.getGroup(this.props.match.params.name);
            let state = {
                error: null,
                ..._.fromPairs(
                    _.toPairs(response.data).reduce(
                        (p, c) => p.concat([c], [["original_" + c[0], c[1]]]),
                        []
                    )
                ),
            };
            state.admins = response.data.admins;
            state.users = response.data.users.map((c) => ({ login: c }));
            this.setState(state);
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
            dirty: true,
        });
    };

    changedName = () => {
        return this.state["name"] !== this.state["original_name"];
    };

    handleCapabilitySet = (newState) => {
        this.setState(newState);
    };

    addMember = async (login) => {
        try {
            await api.addGroupMember(this.props.match.params.name, login);
            this.doUpdate();
            this.setState({
                success: "Member added successfully",
                error: null,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    removeMember = async (login) => {
        try {
            await api.removeGroupMember(this.props.match.params.name, login);
            this.doUpdate();
            this.setState({
                success: "Member removed successfully",
                error: null,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    setAdminMembership = async (login, membership) => {
        try {
            await api.setGroupAdmin(
                this.props.match.params.name,
                login,
                membership
            );
            this.doUpdate();
            this.setState({
                success: "Membership updated successfully",
                error: null,
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    handleGroupUpdate = async (e) => {
        e.preventDefault();
        const groupName = this.props.match.params.name;
        try {
            await api.updateGroup(
                groupName,
                this.state.name,
                this.state.capabilities
            );
            if (this.state.name !== groupName) {
                this.props.history.push(`/group/${groupName}`);
                return;
            }
            this.doUpdate();
        } catch (error) {
            this.setState({ error });
        }
    };

    async componentDidMount() {
        try {
            let response = await api.getUsers();
            this.setState({
                allUsers: response.data.users,
            });
            this.doUpdate();
        } catch (error) {
            this.setState({ error });
        }
    }

    itemsFromDifferentGroups = () => {
        return this.state.allUsers.filter(
            (v) => !this.state.users.map((c) => c.login).includes(v.login)
        );
    };

    render() {
        let changeNotifier = (isChanged) => {
            return isChanged() ? (
                <span style={{ color: "red" }}>*</span>
            ) : (
                <span />
            );
        };
        let groupName = this.props.match.params.name;
        return (
            <div className="container">
                <Alert
                    error={this.state.error}
                    success={this.state.success}
                    warning={
                        groupName === "public"
                            ? "Beware! These settings apply to all users in system!"
                            : this.isGroupImmutable()
                            ? "This group is private, so not all fields can be modified."
                            : null
                    }
                />
                <h2>
                    Group <b>{groupName}</b>
                </h2>
                <form onSubmit={this.handleGroupUpdate}>
                    <div className="form-group">
                        <label>{changeNotifier(this.changedName)}Name</label>
                        <input
                            type="text"
                            name="name"
                            value={this.state.name}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            pattern="[A-Za-z0-9_-]{1,32}"
                            disabled={this.isGroupImmutable()}
                        />
                        <div className="form-hint">
                            Group name must contain only letters, digits, '_'
                            and '-' characters, max 32 characters allowed.
                        </div>
                    </div>
                    <Capabilities
                        onSetState={this.handleCapabilitySet}
                        capabilities={this.state.capabilities}
                        originalCapabilities={
                            this.state["original_capabilities"] || []
                        }
                    />
                    <div className="row">
                        <div className="col-lg-12">
                            <button
                                type="submit"
                                className="btn btn-primary float-right"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </form>

                <h4>Members</h4>

                <GroupMemberList
                    items={this.state.users}
                    admins={this.state.admins}
                    addMember={this.addMember}
                    setAdminMembership={this.setAdminMembership}
                    removeMember={this.removeMember}
                    newMemberItems={this.itemsFromDifferentGroups()}
                    disabled={this.isGroupImmutable()}
                    groupName={this.props.match.params.name}
                />
            </div>
        );
    }
}
