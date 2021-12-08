import React, { useContext } from "react";
import { NavLink, Route, Switch } from "react-router-dom";

import { faUsersCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View, AdministrativeRoute, ShowIf } from "@mwdb-web/commons/ui";
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
import OAuthListProviders from "./Views/OAuthListProviders";
import OAuthRegister from "./Views/OAuthRegister";
import OAuthProvider from "./Views/OAuthProvider";

function SettingsNav() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);

    const adminLinks = [
        ...(auth.hasCapability(Capability.manageUsers)
            ? [
                  [
                      <NavLink exact to="/settings" className="nav-link">
                          Overview
                      </NavLink>,
                  ],
                  <ShowIf condition={config.config["is_registration_enabled"]}>
                      <NavLink
                          exact
                          to="/settings/pending"
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
                      </NavLink>
                  </ShowIf>,
                  <NavLink
                      exact
                      to="/settings/capabilities"
                      className="nav-link"
                  >
                      Access control
                  </NavLink>,
                  <NavLink exact to="/settings/users" className="nav-link">
                      Users
                  </NavLink>,
                  <NavLink exact to="/settings/groups" className="nav-link">
                      Groups
                  </NavLink>,
                  <NavLink to="/settings/attributes" className="nav-link">
                      Attributes
                  </NavLink>,
                  <ShowIf condition={config.config["is_oidc_enabled"]}>
                      <NavLink to="/settings/oauth" className="nav-link">
                          OpenID Connect
                      </NavLink>
                  </ShowIf>,
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
                            <Route exact path="/settings">
                                <SettingsOverview />
                            </Route>
                            <AdministrativeRoute path="/settings/pending">
                                <UsersPendingList />
                            </AdministrativeRoute>

                            <AdministrativeRoute exact path="/settings/users">
                                <UsersList />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/settings/user/new"
                            >
                                <UserCreate />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path={[
                                    "/settings/user/:login",
                                    "/settings/user/:login/password",
                                    "/settings/user/:login/capabilities",
                                    "/settings/user/:login/api-keys",
                                    "/settings/user/:login/groups",
                                ]}
                            >
                                <UserView />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/settings/group/new"
                            >
                                <GroupCreate />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path={[
                                    "/settings/group/:name",
                                    "/settings/group/:name/capabilities",
                                    "/settings/group/:name/members",
                                ]}
                            >
                                <GroupView />
                            </AdministrativeRoute>

                            <AdministrativeRoute exact path="/settings/groups">
                                <GroupsList />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/settings/capabilities"
                            >
                                <AccessControl />
                            </AdministrativeRoute>
                            <AdministrativeRoute exact path="/settings/oauth">
                                <OAuthListProviders />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/settings/oauth/register"
                            >
                                <OAuthRegister />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/settings/oauth/:name"
                            >
                                <OAuthProvider />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/settings/attributes"
                            >
                                <AttributesList />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path="/settings/attribute/new"
                            >
                                <AttributeCreate />
                            </AdministrativeRoute>
                            <AdministrativeRoute
                                exact
                                path={[
                                    "/settings/attribute/:attributeKey",
                                    "/settings/attribute/:attributeKey/permissions",
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
