import React, { useContext } from "react";
import { Link } from "react-router-dom";

import {
    faFile,
    faTable,
    faScroll,
    faUpload,
    faGlobe,
    faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";
import { NavDropdown } from "@mwdb-web/commons/ui";
import { useRemote, useRemotePath } from "@mwdb-web/commons/remotes";

import logo from "../assets/logo.png";

function AdminNav() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);

    if (!auth.isAdmin) return [];
    return (
        <li className="nav-item">
            <Link className="nav-link" to={"/settings"}>
                Settings
                {config.pendingUsers.length ? (
                    <span
                        className="badge badge-pill badge-warning"
                        style={{ marginLeft: "8px" }}
                    >
                        {config.pendingUsers.length}
                    </span>
                ) : (
                    []
                )}
            </Link>
        </li>
    );
}

function RemoteDropdown() {
    const config = useContext(ConfigContext);
    if (!config.isReady) return [];

    const remotes = config.config.remotes || [];
    const remoteItems = remotes.map((remote) => (
        <Link key="remote" className="dropdown-item" to={`/remote/${remote}`}>
            {remote}
        </Link>
    ));

    return (
        <NavDropdown
            title="Switch to remote..."
            elements={[...remoteItems]}
            icon={faGlobe}
        />
    );
}

function UploadButton() {
    const auth = useContext(AuthContext);
    const buttonLink = auth.hasCapability(Capability.addingFiles) ? (
        <Link className="nav-link" to={"/upload"}>
            <FontAwesomeIcon className="navbar-icon" icon={faUpload} />
            Upload
        </Link>
    ) : (
        <div className="nav-link text-muted">
            <span
                data-toggle="tooltip"
                title="File upload is disabled for your account"
            >
                <FontAwesomeIcon className="navbar-icon" icon={faUpload} />
                Upload
            </span>
        </div>
    );
    return buttonLink;
}

export default function Navigation() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const remote = useRemote();
    const remotePath = useRemotePath();
    const navItems = config.isReady ? (
        <Extendable ident="navbar">
            {!auth.isAuthenticated &&
            config.config["is_registration_enabled"] ? (
                <li className="nav-item">
                    <Link className="nav-link" to={"/register"}>
                        Register user
                    </Link>
                </li>
            ) : (
                []
            )}
            {!auth.isAuthenticated && config.config["is_oidc_enabled"] ? (
                <li className="nav-item">
                    <Link className="nav-link" to={"/oauth/login"}>
                        OAuth authentication
                    </Link>
                </li>
            ) : (
                []
            )}
            {auth.isAuthenticated ? (
                <Extendable ident="navbarAuthenticated">
                    <li className="nav-item">
                        <Link className="nav-link" to={"/"}>
                            <FontAwesomeIcon
                                className="navbar-icon"
                                icon={faFile}
                            />
                            Samples
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to={"/configs"}>
                            <FontAwesomeIcon
                                className="navbar-icon"
                                icon={faTable}
                            />
                            Configs
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to={"/blobs"}>
                            <FontAwesomeIcon
                                className="navbar-icon"
                                icon={faScroll}
                            />
                            Blobs
                        </Link>
                    </li>
                    <li className="nav-item">
                        <UploadButton />
                    </li>
                </Extendable>
            ) : (
                []
            )}
            {auth.isAuthenticated ? (
                <React.Fragment>
                    <li className="nav-item">
                        <Link className="nav-link" to={"/search"}>
                            Search
                        </Link>
                    </li>
                    <AdminNav />
                    <li className="nav-item">
                        <Link className="nav-link" to={"/configs/stats"}>
                            Statistics
                        </Link>
                    </li>
                </React.Fragment>
            ) : (
                []
            )}
            <NavDropdown
                title="About"
                elements={[
                    ...(auth.isAuthenticated
                        ? [
                              <Link
                                  key="about"
                                  className="dropdown-item"
                                  to="/about"
                              >
                                  About mwdb
                              </Link>,
                              <Link
                                  key="docs"
                                  className="dropdown-item"
                                  to="/docs"
                              >
                                  Docs
                              </Link>,
                          ]
                        : []),
                    ...fromPlugin("navdropdownAbout"),
                ]}
            />
            <NavDropdown
                title="Extras"
                elements={[...fromPlugin("navdropdownExtras")]}
            />
        </Extendable>
    ) : (
        []
    );

    const remoteNavItems =
        config.isReady && auth.isAuthenticated ? (
            <Extendable ident="navbarAuthenticated">
                <React.Fragment>
                    <li className="nav-item">
                        <Link className="nav-link" to={`${remotePath}/`}>
                            <FontAwesomeIcon
                                className="navbar-icon"
                                icon={faFile}
                            />
                            Samples
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to={`${remotePath}/configs`}>
                            <FontAwesomeIcon
                                className="navbar-icon"
                                icon={faTable}
                            />
                            Configs
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to={`${remotePath}/blobs`}>
                            <FontAwesomeIcon
                                className="navbar-icon"
                                icon={faScroll}
                            />
                            Blobs
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link" to={`${remotePath}/search`}>
                            Search
                        </Link>
                    </li>
                </React.Fragment>
            </Extendable>
        ) : (
            []
        );

    return (
        <nav className="navbar navbar-expand-lg navbar-dark">
            <Link className="navbar-brand" to="/">
                <Extendable ident="navbarLogo">
                    <img src={logo} alt="logo" className="logo" />
                    mwdb
                </Extendable>
            </Link>
            <button
                className="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#navbarSupportedContent"
            >
                <span className="navbar-toggler-icon" />
            </button>
            <div
                className="collapse navbar-collapse"
                id="navbarSupportedContent"
            >
                <ul className="navbar-nav mr-auto">
                    {remote ? remoteNavItems : navItems}
                </ul>
                <div className="my-2 my-lg-0">
                    <ul className="navbar-nav">
                        <Extendable ident="navbarRight">
                            {auth.isAuthenticated ? (
                                <React.Fragment>
                                    <RemoteDropdown />
                                    <li className="nav-item">
                                        <div className="btn-group">
                                            {remote ? (
                                                <Link
                                                    className="btn btn-outline-info
                                                   "
                                                    to={"/"}
                                                >
                                                    Local instance
                                                </Link>
                                            ) : (
                                                <React.Fragment>
                                                    <Link
                                                        className="btn btn-outline-success profile-button"
                                                        to="/profile"
                                                    >
                                                        <FontAwesomeIcon
                                                            className="navbar-icon"
                                                            icon={faUser}
                                                        />
                                                        {auth.user.login}
                                                    </Link>
                                                    <a
                                                        className="btn btn-outline-danger"
                                                        href="#logout"
                                                        onClick={(ev) => {
                                                            ev.preventDefault();
                                                            auth.logout();
                                                        }}
                                                    >
                                                        Logout
                                                    </a>
                                                </React.Fragment>
                                            )}
                                        </div>
                                    </li>
                                </React.Fragment>
                            ) : (
                                []
                            )}
                        </Extendable>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
