import React, { useState, useEffect, useContext } from "react";
import { NavLink, Redirect, Route, Switch } from "react-router-dom";

import { faUsersCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import {
    View,
    AdministrativeRoute,
    AttributeRoute,
} from "@mwdb-web/commons/ui";
import ShowGroups from "../ShowGroups";
import ShowUsers from "../ShowUsers";
import ShowPendingUsers from "../ShowPendingUsers";
import ManageAttributes from "../ManageAttributes";

function SettingsNav() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const [pendingUsersCount, setPendingUsersCount] = useState(null);
    const isAdmin = auth.isAdmin;

    async function updatePendingUsersCount() {
        try {
            let response = await api.getPendingUsers();
            setPendingUsersCount(response.data.users.length);
        } catch (error) {
            console.error(error);
            setPendingUsersCount("?");
        }
    }

    useEffect(() => {
        if (!isAdmin) return;
        let timer = setInterval(updatePendingUsersCount, 15000);
        updatePendingUsersCount();
        return () => {
            clearInterval(timer);
        };
    }, [isAdmin]);

    const adminLinks = [
        ...(auth.hasCapability(Capability.manageUsers)
            ? [
                  ...(config.config["is_registration_enabled"]
                      ? [
                            <NavLink
                                exact
                                to="/admin/pending"
                                className="nav-link"
                            >
                                Pending registrations
                                {pendingUsersCount ? (
                                    <span
                                        className="badge badge-pill badge-warning"
                                        style={{ marginLeft: "8px" }}
                                    >
                                        {pendingUsersCount}
                                    </span>
                                ) : (
                                    []
                                )}
                            </NavLink>,
                        ]
                      : []),
                  <NavLink exact to="/admin/capabilities" className="nav-link">
                      Access control
                  </NavLink>,
                  <NavLink exact to="/admin/users" className="nav-link">
                      User settings
                  </NavLink>,
                  <NavLink exact to="/admin/groups" className="nav-link">
                      Group settings
                  </NavLink>,
              ]
            : []),
        ...(auth.hasCapability(Capability.managingAttributes)
            ? [
                  <NavLink to="/admin/attributes" className="nav-link">
                      Attribute settings
                  </NavLink>,
              ]
            : []),
    ];

    return (
        <div>
            {adminLinks.length > 0 ? (
                <React.Fragment>
                    <strong>
                        <FontAwesomeIcon icon={faUsersCog} /> Administration
                    </strong>
                    <div className="nav flex-column nav-pills">
                        {adminLinks}
                    </div>
                </React.Fragment>
            ) : (
                []
            )}
        </div>
    );
}

export default function SettingsView(props) {
    return (
        <View
            ident="settings"
            error={props.error}
            success={props.success}
            fluid
        >
            <div className="row">
                <div className="col-2">
                    <SettingsNav />
                </div>
                <div className="col-10">
                    <div className="tab-content">
                        <Switch>
                            <Route exact path="/admin">
                                <Redirect to="/admin/pending" />
                            </Route>
                            <AdministrativeRoute path="/admin/pending">
                                <ShowPendingUsers />
                            </AdministrativeRoute>
                            <AdministrativeRoute path="/admin/users">
                                <ShowUsers />
                            </AdministrativeRoute>
                            <AdministrativeRoute path="/admin/groups">
                                <ShowGroups />
                            </AdministrativeRoute>
                            <AttributeRoute path="/admin/attributes">
                                <ManageAttributes />
                            </AttributeRoute>
                        </Switch>
                    </div>
                </div>
            </div>
        </View>
    );
}
