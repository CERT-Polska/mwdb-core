import React, { useContext } from "react";
import { Link } from "react-router-dom";

import {
    faCog,
    faFile,
    faTable,
    faScroll,
    faUpload,
    faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";
import { NavDropdown } from "@mwdb-web/commons/ui";
import { useRemote, useRemotePath } from "@mwdb-web/commons/remotes";

import logo from "../assets/logo.png";


function RemoteDropdown() {
    const config = useContext(ConfigContext);
    if (!config.config) return [];

    const remoteItems = config.config.remotes.map((remote) => (
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

export default function Navigation() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const remote = useRemote();
    const remotePath = useRemotePath();
    const navItems = config.config ? (
        <Extendable ident="navbar">
            {!auth.isAuthenticated &&
            config.config["is_registration_enabled"] ? (
                <React.Fragment>
                    <li className="nav-item">
                        <Link className="nav-link" to={"/register"}>
                            Register user
                        </Link>
                    </li>
                </React.Fragment>
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
                        <Link className="nav-link" to={"/upload"}>
                            <FontAwesomeIcon
                                className="navbar-icon"
                                icon={faUpload}
                            />
                            Upload
                        </Link>
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
        config.config && auth.isAuthenticated ? (
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
                                    {!remote && (
                                        <li className="nav-item">
                                            <span
                                                className="navbar-text"
                                                style={{ marginRight: "1rem" }}
                                            >
                                                Logged as:{" "}
                                                <b>{auth.user.login}</b>
                                            </span>
                                        </li>
                                    )}
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
                                                        className="btn btn-outline-success"
                                                        to="/settings"
                                                    >
                                                        <FontAwesomeIcon
                                                            className="navbar-icon"
                                                            icon={faCog}
                                                        />
                                                        Settings
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
