import React, { useState, useEffect, useContext } from "react";
import { NavLink, Route, Switch } from "react-router-dom";

import { faUsersCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View, AdministrativeRoute } from "@mwdb-web/commons/ui";
import GroupsList from "./Views/GroupsList";
import UsersList from "./Views/UsersList";
import UsersPendingList from "./Views/UsersPendingList";
import AttributesList from "./Views/AttributesList";
import UserCreate from "./Views/UserCreate";
import GroupCreate from "./Views/GroupCreate";
import AttributeCreate from "./Views/AttributeCreate";
import UserView from "./Views/UserView";
import AccessControl from "./Views/AccessControl";
import GroupView from "./Views/GroupView";
import AttributeView from "./Views/AttributeView";
import SettingsOverview from "./Views/SettingsOverview";

function SettingsNav() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const isAdmin = auth.isAdmin;

    useEffect(() => {
        if (!isAdmin) return;
        let timer = setInterval(config.updatePendingUsers, 15000);
        config.updatePendingUsers();
        return () => {
            clearInterval(timer);
        };
    }, [isAdmin]);

    const adminLinks = [
        ...(auth.hasCapability(Capability.manageUsers)
            ? [
                  [
                      <NavLink exact to="/admin" className="nav-link">
                          Overview
                      </NavLink>,
                  ],
                  ...(config.config["is_registration_enabled"]
                      ? [
                            <NavLink
                                exact
                                to="/admin/pending"
                                className="nav-link"
                            >
                                Pending registrations
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
                            </NavLink>,
                        ]
                      : []),
                  <NavLink exact to="/admin/capabilities" className="nav-link">
                      Access control
                  </NavLink>,
                  <NavLink exact to="/admin/users" className="nav-link">
                      Users
                  </NavLink>,
                  <NavLink exact to="/admin/groups" className="nav-link">
                      Groups
                  </NavLink>,
                  <NavLink to="/admin/attributes" className="nav-link">
                      Attributes
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
                    <div className="nav sidenav flex-column">{adminLinks}</div>
                </React.Fragment>
            ) : (
                []
            )}
            <hr />
        </div>
    );
}

export default function SettingsView() {
    return (
        <View ident="settings" fluid>
            <div className="row">
                <div className="col-sm-2">
                    <SettingsNav />
                </div>
                <div className="col-sm-8">
                    <div className="tab-content">
                        <Switch>
                            <Route exact path="/admin">
                                <SettingsOverview />
                            </Route>
                            <AdministrativeRoute path="/admin/pending">
                                <UsersPendingList />
                            </AdministrativeRoute>

                            <AdministrativeRoute exact path="/admin/users">
                                <UsersList />
                            </AdministrativeRoute>
                            <AdministrativeRoute exact path="/admin/user/new">
                                <UserCreate />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path={[
                                    "/admin/user/:login",
                                    "/admin/user/:login/password",
                                    "/admin/user/:login/capabilities",
                                    "/admin/user/:login/api-keys",
                                    "/admin/user/:login/groups",
                                ]}
                            >
                                <UserView />
                            </AdministrativeRoute>
                            <AdministrativeRoute exact path="/admin/group/new">
                                <GroupCreate />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path={[
                                    "/admin/group/:name",
                                    "/admin/group/:name/capabilities",
                                    "/admin/group/:name/members",
                                ]}
                            >
                                <GroupView />
                            </AdministrativeRoute>

                            <AdministrativeRoute exact path="/admin/groups">
                                <GroupsList />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/admin/capabilities"
                            >
                                <AccessControl />
                            </AdministrativeRoute>

                            <AdministrativeRoute exact path="/admin/attributes">
                                <AttributesList />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/admin/attribute/new"
                            >
                                <AttributeCreate />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path={[
                                    "/admin/attribute/:metakey",
                                    "/admin/attribute/:metakey/permissions",
                                ]}
                            >
                                <AttributeView />
                            </AdministrativeRoute>
                        </Switch>
                    </div>
                </div>
            </div>
        </View>
    );
}
