import React, {useContext, useEffect, useState} from 'react';
import { Link } from 'react-router-dom';

import { faFile, faTable, faScroll, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";
import { NavDropdown } from '@mwdb-web/commons/ui';

import logo from "../assets/logo.png"


function AdminDropdown() {
    const [pendingUsersCount, setPendingUsersCount] = useState(null);

    async function updatePendingUsersCount() {
        try {
            let response = await api.getPendingUsers()
            setPendingUsersCount(response.data.users.length);
        } catch(error) {
            console.error(error);
            setPendingUsersCount("?");
        }
    }

    useEffect(() => {
        let timer = setInterval(updatePendingUsersCount, 15000);
        updatePendingUsersCount();
        return () => {
            clearInterval(timer);
        }
    }, [])

    return (
        <NavDropdown 
            title="Admin"
            elements={[
                <Link key="pending-users" className="dropdown-item" to="/users/pending">
                    Pending users
                    {
                        pendingUsersCount
                        ? (
                            <span className="badge badge-pill badge-warning">
                                {pendingUsersCount}
                            </span>
                        ) : []
                    }
                </Link>,
                <Link key="users" className="dropdown-item" to="/users">Manage users</Link>,
                <Link key="groups" className="dropdown-item" to="/groups">Manage groups</Link>,
                ...fromPlugin("navdropdownAdmin")
            ]} 
            badge={pendingUsersCount}
        />
    )
}

export default function Navigation() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);

    const NavItems = (
        config.config
        ? () => (
            <Extendable ident="navbar">
                {
                    !auth.isAuthenticated && config.config["is_registration_enabled"] ? (
                        <React.Fragment>
                            <li className="nav-item">
                                <Link className="nav-link" to={'/register'}>Register user</Link>
                            </li>
                        </React.Fragment>
                    ) : []
                }
                {
                    auth.isAuthenticated ? (
                        <Extendable ident="navbarAuthenticated">
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
                {
                    auth.isAdmin
                    ? <AdminDropdown /> 
                    : []
                }
                {
                    auth.hasCapability("managing_attributes")
                    ? (
                        <li className="nav-item">
                            <Link className="nav-link" to="/attributes">Attributes</Link>
                        </li>
                    ) : []
                }
                {
                    auth.isAuthenticated ? (
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
                                ...(auth.isAuthenticated ? [
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
        ) : () => []
    )

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
                    <NavItems />
                </ul>
                <div className="my-2 my-lg-0">
                    <ul className="navbar-nav">
                        <Extendable ident="navbarRight">
                        {
                            auth.isAuthenticated ? (
                                <React.Fragment>
                                    <li className="nav-item">
                                        <span className="navbar-text" style={{marginRight: "1rem"}}>
                                            Logged as: <b>{auth.user.login}</b>
                                        </span>
                                    </li>
                                    <li className="nav-item">
                                        <div class="btn-group">
                                            <Link className="btn btn-outline-success" to={`/profile/${auth.user.login}`}>Profile</Link>
                                            <a className="btn btn-outline-danger" href="#logout" onClick={(ev) => { ev.preventDefault(); auth.logout(); }}>Logout</a>
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
