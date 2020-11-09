import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {withRouter} from 'react-router-dom';

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import api from "@mwdb-web/commons/api";
import { authActions } from "@mwdb-web/commons/auth";

import logo from "../assets/logo.png"
import { NavDropdown } from '@mwdb-web/commons/ui';
import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";

import { faFile, faTable, faScroll, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

class Navigation extends Component {
    pendingRefreshTimer = null;

    state = {
        pendingUsersCount: undefined
    }

    async updatePendingUsersCount() {
        if(this.props.isAdmin)
        {
            try {
                let response = await api.getPendingUsers()
                this.setState({pendingUsersCount: response.data.users.length});
            } catch(error) {}
        }
    }

    componentDidMount() {
        if(!this.pendingRefreshTimer)
        {
            this.pendingRefreshTimer = setInterval(() => this.updatePendingUsersCount(), 60000);
            this.updatePendingUsersCount();
        }
    }

    componentWillUnmount() {
        if(this.pendingRefreshTimer)
        {
            clearInterval(this.pendingRefreshTimer);
            this.pendingRefreshTimer = null;
        }
    }

    handleLogout = (event) => {
        event.preventDefault();
        this.props.auth.logout({success: "User logged out successfully."});
    }

    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-dark">
                <Link className="navbar-brand" to={'/'}>
                    <Extendable ident="navbarLogo">
                        <img src={logo} alt="logo" className="logo"/>
                        mwdb
                    </Extendable>
                </Link>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav mr-auto">
                        <Extendable ident="navbar" extProps={this.props}>
                        {
                            !this.props.isAuthenticated && this.props.isRegistrationEnabled ? (
                                <React.Fragment>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={'/register'}>Register user</Link>
                                    </li>
                                </React.Fragment>
                            ) : []
                        }
                        {
                            this.props.isAuthenticated ? (
                                <Extendable ident="navbarAuthenticated" extProps={this.props}>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={'/'}><FontAwesomeIcon className="navbar-icon" icon={faFile} />Samples</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={'/configs'}><FontAwesomeIcon className="navbar-icon" icon={faTable} />Configs</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={'/blobs'}><FontAwesomeIcon className="navbar-icon" icon={faScroll} />Blobs</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={'/upload'}><FontAwesomeIcon className="navbar-icon" icon={faUpload} />Upload</Link>
                                    </li>
                                </Extendable>
                            ) : []
                        }
                        <NavDropdown title="Admin"
                                     elements={[
                                        ...(this.props.isAdmin ? [
                                            <Link key="pending-users" className="dropdown-item" to="/users/pending">
                                                Pending users
                                                {
                                                    this.state.pendingUsersCount
                                                    ? <span className="badge badge-pill badge-warning">
                                                        {this.state.pendingUsersCount}
                                                      </span>
                                                    : []
                                                }
                                            </Link>,
                                            <Link key="users" className="dropdown-item" to="/users">Manage users</Link>,
                                            <Link key="groups" className="dropdown-item" to="/groups">Manage groups</Link>
                                        ] : []),
                                        ...(this.props.isAttributeManager ? [
                                            <Link key="attributes" className="dropdown-item" to="/attributes">Manage attributes</Link>
                                        ] : []),
                                        ...fromPlugin("navdropdownAdmin")
                                     ]} 
                                     badge={this.state.pendingUsersCount}/>
                        {
                            this.props.isAuthenticated ? (
                                <React.Fragment>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={'/search'}>Search</Link>
                                    </li>
                                    <li>
                                        <Link className="nav-link" to="/user_groups">Groups</Link>
                                    </li>
                                    <li className="nav-item">
                                        <Link className="nav-link" to={'/configs/stats'}>Statistics</Link>
                                    </li>
                                </React.Fragment>
                            ) : []
                        }
                        <NavDropdown title="About"
                                     elements={[
                                        ...(this.props.isAuthenticated ? [
                                            <Link key="about" className="dropdown-item" to="/about">About mwdb</Link>,
                                            <Link key="docs" className="dropdown-item" to="/docs">Docs</Link>
                                        ] : []),
                                        ...fromPlugin("navdropdownAbout")
                                     ]} />
                        <NavDropdown title="Extras"
                                     elements={[
                                         ...fromPlugin("navdropdownExtras")
                                     ]} />
                        </Extendable>
                    </ul>
                    <div className="my-2 my-lg-0">
                        <ul className="navbar-nav">
                            <Extendable ident="navbarRight" extProps={this.props}>
                            {
                                this.props.isAuthenticated ? (
                                    <React.Fragment>
                                        <li className="nav-item">
                                            <span className="navbar-text" style={{marginRight: "1rem"}}>
                                                Logged as: <b>{this.props.userLogin}</b>
                                            </span>
                                        </li>
                                        <li className="nav-item">
                                            <div class="btn-group">
                                                <Link className="btn btn-outline-success" to={`/profile/${this.props.userLogin}`}>Profile</Link>
                                                <a className="btn btn-outline-danger" href="#logout" onClick={this.handleLogout}>Logout</a>
                                            </div>
                                        </li>
                                    </React.Fragment>
                                ) : []
                            }
                            </Extendable>
                        </ul>
                    </div>
                </div>
            </nav>
        )
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        error: state.config.error,
        config: state.config.config,
        capabilities: state.auth.loggedUser && state.auth.loggedUser.capabilities,
        isAuthenticated: !!state.auth.loggedUser,
        isAdmin: state.auth.loggedUser && state.auth.loggedUser.capabilities.indexOf("manage_users") >= 0,
        isAttributeManager: state.auth.loggedUser && state.auth.loggedUser.capabilities.indexOf("managing_attributes") >= 0,
        isRegistrationEnabled: state.config.config && state.config.config["is_registration_enabled"],
        userLogin: state.auth.loggedUser && state.auth.loggedUser.login
    }
}

function mapDispatchToProps(dispatch) {
    return {
        auth: bindActionCreators(authActions, dispatch)
    }
}

export default connect( mapStateToProps, mapDispatchToProps )(withRouter(Navigation));
