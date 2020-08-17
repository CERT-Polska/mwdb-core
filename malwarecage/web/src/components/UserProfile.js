import React, {Component} from 'react';
import { connect } from "react-redux";
import {capabilitiesList} from "./Capabilities";
import api from "@malwarefront/api";
import { View, DateString } from "@malwarefront/ui";

import ManageAPIKeys from './ManageAPIKeys';

class UserProfile extends Component {
    state = {
        pressedRequestPassword: false
    }

    get capabilities() {
        return [...this.state.profile.groups.reduce((p, c) => new Set([...p, ...c.capabilities]), new Set())]
    }

    inheritedFrom(cap) {
        return this.state.profile.groups.filter(c => c.capabilities.includes(cap)).map(c => c.name)
    }

    get groups() {
        return this.state.profile.groups.filter(g => g.name !== "public" && !g.private)
    }

    async handleUpdate() {
        try {
            let response = await api.authProfile()
            this.setState({
                profile: response.data,
            })

        } catch(error) {
            this.setState({error})
        }
    }

    requestPasswordChange = async () => {
        try {
            await api.authRequestPasswordChange();
            this.setState({
                pressedRequestPassword: true,
                success: "Password reset link has been sent to your e-mail address."
            });
        } catch(error) {
            this.setState({error})
        } 
    }

    async componentDidMount() {
        this.handleUpdate();
    }

    render() {
        if (!this.state.profile) {
            return <div>Loading...</div>;
        }

        
        return (
            <View ident="userProfile" error={this.state.error} success={this.state.success}>
                <h2>Profile {this.props.userLogin} info</h2>
                <table className="table table-striped table-bordered wrap-table">
                    <thead>
                        <tr>
                            <th key="key">Attribute</th>
                            <th key="value">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>E-mail</td>
                            <td>{this.state.profile.email}</td>
                        </tr>
                        <tr>
                            <td>Registered</td>
                            <td><DateString date={this.state.profile.registered_on}/></td>
                        </tr>
                        <tr>
                            <td>Last login</td>
                            <td><DateString date={this.state.profile.logged_on}/></td>
                        </tr>
                        <tr>
                            <td>Last password set</td>
                            <td><DateString date={this.state.profile.set_password_on}/></td>
                        </tr>
                        <tr>
                            <td style={{textAlign: 'left'}} colspan="3">
                                    <button type="button" className="btn btn-success" 
                                    onClick={this.requestPasswordChange} disabled = {this.state.pressedRequestPassword}>
                                        Request new password
                                    </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                {
                    this.capabilities.length > 0
                    ? <div className="form-group">
                        <label>User is allowed to:</label>
                        <ul>
                        {
                            this.capabilities.map(
                                c => <li>{capabilitiesList[c]} (inherited from: {this.inheritedFrom(c).join(", ")})</li>)
                        }
                        </ul>
                      </div>
                    : []
                }
                {
                    this.groups.length > 0
                    ? <div className="form-group">
                        <label>User is member of:</label>
                        <ul>
                        {
                            this.groups.map(g => <li>{g.name}</li>)
                        }
                        </ul>
                      </div>
                    : []
                }
                <h4>API keys</h4>

                <ManageAPIKeys items={this.state.profile.api_keys}
                               userLogin={this.props.userLogin}
                               onSuccess={(success) => { this.handleUpdate(); this.setState({success}); }}
                               onError={(error) => this.setState({error})} />
            </View>
        )
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        userLogin: state.auth.loggedUser && state.auth.loggedUser.login
    }
}

export default connect(mapStateToProps)(UserProfile);
