import React, { useState, useEffect, useContext } from "react";
import { NavLink, Route, Switch } from "react-router-dom";

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
import ShowGroups from "./Views/ShowGroups";
import ShowUsers from "./Views/ShowUsers";
import ShowPendingUsers from "./Views/ShowPendingUsers";
import ManageAttributes from "./Views/ManageAttributes";
import UserCreate from "./Views/UserCreate";
import GroupRegister from "./Views/GroupRegister";
import AttributeDefine from "./Views/AttributeDefine";
import UserView from "./Views/UserView";
import AccessControl from "./Views/AccessControl";
import GroupView from "./Views/GroupView";
import AttributeView from "./Views/AttributeView";
import SettingsOverview from "./Views/SettingsOverview";

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
        ...(auth.hasCapability(Capability.managingAttributes) ||
        auth.hasCapability(Capability.manageUsers)
            ? [
                  <NavLink to="/admin" className="nav-link">
                      Overview
                  </NavLink>,
              ]
            : []),
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
                      Users
                  </NavLink>,
                  <NavLink exact to="/admin/groups" className="nav-link">
                      Groups
                  </NavLink>,
              ]
            : []),
        ...(auth.hasCapability(Capability.managingAttributes)
            ? [
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
                    <div className="nav flex-column">{adminLinks}</div>
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
                <div className="col-8">
                    <div className="tab-content">
                        <Switch>
                            <Route exact path="/admin">
                                <SettingsOverview />
                            </Route>
                            <AdministrativeRoute path="/admin/pending">
                                <ShowPendingUsers />
                            </AdministrativeRoute>

                            <AdministrativeRoute exact path="/admin/users">
                                <ShowUsers />
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
                                <GroupRegister />
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
                                <ShowGroups />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/admin/capabilities"
                            >
                                <AccessControl />
                            </AdministrativeRoute>

                            <AttributeRoute exact path="/admin/attributes">
                                <ManageAttributes />
                            </AttributeRoute>
                            <AttributeRoute exact path="/admin/attribute/new">
                                <AttributeDefine />
                            </AttributeRoute>
                            <AttributeRoute
                                exact
                                path={[
                                    "/admin/attribute/:metakey",
                                    "/admin/attribute/:metakey/permissions",
                                ]}
                            >
                                <AttributeView />
                            </AttributeRoute>
                        </Switch>
                    </div>
                </div>
            </div>
        </View>
    );
}
