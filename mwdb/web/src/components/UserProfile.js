import React, {Component} from 'react';
import { connect } from "react-redux";
import { Link } from "react-router-dom"
import {capabilitiesList} from "./Capabilities";

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import api from "@mwdb-web/commons/api";
import { View, DateString, ErrorBoundary, ActionCopyToClipboard } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "../commons/helpers";

import ManageAPIKeys from './ManageAPIKeys';

class UserProfile extends Component {
    state = {
        pressedRequestPassword: false,
        error: false
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

    handleUpdate = async () => {
        try {
            let response = await api.getUserProfile(this.props.match.params.login)
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
        } else if(!this.state.profile && this.state.error) {
            return <ErrorBoundary error={this.state.error}/>
        }
        
        return (
            <View ident="userProfile" error={this.state.error} success={this.state.success}>
                <table className="table table-striped table-bordered wrap-table">
                    <thead>
                        <tr>
                            <th key="key">Attribute</th>
                            <th key="value">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="flickerable">
                            <td>Login</td>
                            <td>
                                {this.state.profile.login}
                                <span className="ml-2">
                                    <i data-toggle="tooltip" title="Click to search for user samples">
                                        <Link to={makeSearchLink("uploader", this.state.profile.login)} style={{color:'black'}}>
                                            <FontAwesomeIcon icon={"search"} size="sm" style={{cursor: "pointer"}}/>
                                        </Link>
                                    </i>
                                </span>
                            </td>
                        </tr>
                        <tr className="flickerable">
                            <td>E-mail</td>
                            <td>
                                {this.state.profile.email}
                                <span className="ml-2">
                                    <ActionCopyToClipboard text={this.state.profile.email}/>
                                </span>
                            </td>
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
                        {this.capabilities.length > 0 &&
                        <tr>
                            <td>
                                Capabilities
                            </td>
                            <td style={{padding: 22}}>
                                        {
                                            this.capabilities.map(
                                                c => <li>{capabilitiesList[c]} (inherited
                                                    from: {this.inheritedFrom(c).join(", ")})</li>)
                                        }
                            </td>
                        </tr>
                        }
                        {this.groups.length > 0 &&
                        <tr>
                            <td>
                                Groups
                            </td>
                            <td style={{padding: 22}}>
                                        {
                                             this.groups.map(g => <li>{g.name}</li>)
                                        }
                            </td>
                        </tr>
                        }
                        {this.props.userLogin === this.state.profile.login &&
                        <tr>
                            <td style={{textAlign: 'left'}} colspan="3">
                                    <button type="button" className="btn btn-success"
                                    onClick={this.requestPasswordChange} disabled = {this.state.pressedRequestPassword}>
                                        Request new password
                                    </button>
                            </td>
                        </tr>
                        }
                    </tbody>
                </table>
                {this.props.userLogin === this.state.profile.login &&
                <div>
                    <h4>API keys</h4>

                    <ManageAPIKeys items={this.state.profile.api_keys}
                                   userLogin={this.props.userLogin}
                                   onSuccess={(success) => { this.handleUpdate(); this.setState({success}); }}
                                   onError={(error) => this.setState({error})} />
                </div>
                }
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
