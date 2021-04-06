import React, { useContext } from "react";
import { NavLink, Redirect, Route, Switch } from "react-router-dom";

import { faUser, faUsersCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

import AccountSubview from "./AccountSubview";
import AccountAPIKeys from "./AccountAPIKeys";

function SettingsNav() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const adminLinks = [
        ...(auth.hasCapability("manage_users")
            ? [
                  ...(config.config["is_registration_enabled"]
                      ? [
                            <NavLink
                                exact
                                to="/settings/admin/pending"
                                className="nav-link"
                            >
                                Pending registrations
                            </NavLink>,
                        ]
                      : []),
                  <NavLink
                      exact
                      to="/settings/admin/capabilities"
                      className="nav-link"
                  >
                      Access control
                  </NavLink>,
                  <NavLink exact to="/settings/admin/users" className="nav-link">
                      User settings
                  </NavLink>,
                  <NavLink exact to="/settings/admin/groups" className="nav-link">
                      Group settings
                  </NavLink>,
              ]
            : []),
        ...(auth.hasCapability("managing_attributes")
            ? [
                  <NavLink to="/settings/admin/attributes" className="nav-link">
                      Attribute settings
                  </NavLink>,
              ]
            : []),
    ];

    return (
        <div>
            <strong>
                <FontAwesomeIcon icon={faUser} />{" "}
                Profile settings
            </strong>
            <div className="nav flex-column nav-pills">
                <NavLink exact to="/settings/account" className="nav-link">
                    Account
                </NavLink>
                <NavLink exact to="/settings/api-keys" className="nav-link">
                    API keys
                </NavLink>
            </div>
            {adminLinks.length > 0 ? (
                <React.Fragment>
                    <hr />
                    <strong>
                        <FontAwesomeIcon icon={faUsersCog} />{" "}
                        Administration
                    </strong>
                    <div className="nav flex-column nav-pills">
                        {adminLinks}
                    </div>
                </React.Fragment>
            ) : (
                []
            )}
        </div>
    )
}

export default function SettingsView(props) {
    return (
        <View ident="settings" error={props.error} success={props.success}>
            <div className="row">
                <div className="col-3">
                    <SettingsNav />
                </div>
                <div className="col-9">
                    <div className="tab-content">
                        <Switch>
                            <Route exact path="/settings">
                                <Redirect to="/settings/account"/>
                            </Route>
                            <Route path={[
                                "/settings/account",
                                "/settings/user/:user"
                            ]}>
                                <AccountSubview />
                            </Route>
                            <Route exact path="/settings/api-keys">
                                <AccountAPIKeys />
                            </Route>
                            <Route exact path="/settings/group/:group">
                                todo
                            </Route>
                        </Switch>
                    </div>
                </div>
            </div>
        </View>
    );
}
