import React, { useCallback, useContext, useEffect, useState } from "react";
import { NavLink, Route, Switch, useParams } from "react-router-dom";

import { faUserCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

import ProfileDetails from "./Views/ProfileDetails";
import ProfileAPIKeys from "./Views/ProfileAPIKeys";
import ProfileCapabilities from "./Views/ProfileCapabilities";
import ProfileResetPassword from "./Views/ProfileResetPassword";
import ProfileGroup from "./Views/ProfileGroup";
import ProfileGroups from "./Views/ProfileGroups";
import ProfileGroupMembers from "./Views/ProfileGroupMembers";
import { useViewAlert } from "../../commons/ui";
import { ProfileOAuth } from "./Views/ProfileOAuth";

function ProfileNav() {
    const config = useContext(ConfigContext);

    return (
        <div>
            <strong>
                <FontAwesomeIcon icon={faUserCog} /> Profile
            </strong>
            <div className="nav sidenav flex-column">
                <NavLink exact to="/profile" className="nav-link">
                    Profile details
                </NavLink>
                <NavLink exact to="/profile/capabilities" className="nav-link">
                    Capabilities
                </NavLink>
                <NavLink exact to="/profile/groups" className="nav-link">
                    Groups
                </NavLink>
                <NavLink exact to="/profile/api-keys" className="nav-link">
                    API keys
                </NavLink>
                {config.config["is_oidc_enabled"] ? (
                    <NavLink exact to="/profile/oauth" className="nav-link">
                        OpenID Connect
                    </NavLink>
                ) : (
                    []
                )}
            </div>
            <hr />
        </div>
    );
}

export default function ProfileView() {
    const auth = useContext(AuthContext);
    const { redirectToAlert } = useViewAlert();
    const user = useParams().user || auth.user.login;
    const [profile, setProfile] = useState();

    async function updateProfile() {
        try {
            const response = await api.getUserProfile(user);
            setProfile(response.data);
        } catch (error) {
            redirectToAlert({
                target: "/profile",
                error,
            });
        }
    }

    const getProfile = useCallback(updateProfile, [user, redirectToAlert]);

    useEffect(() => {
        getProfile();
    }, [getProfile]);

    if (!profile || profile.login !== user) return [];

    return (
        <View ident="profile" fluid>
            <div className="row">
                <div className="col-sm-2">
                    <ProfileNav />
                </div>
                <div className="col-sm-8">
                    <Switch>
                        <Route exact path={["/profile", "/profile/user/:user"]}>
                            <ProfileDetails profile={profile} />
                        </Route>
                        <Route exact path="/profile/group/:group">
                            <ProfileGroup profile={profile} />
                        </Route>
                        <Route exact path="/profile/group/:group/members">
                            <ProfileGroupMembers profile={profile} />
                        </Route>
                        <Route exact path="/profile/groups">
                            <ProfileGroups profile={profile} />
                        </Route>
                        <Route exact path="/profile/capabilities">
                            <ProfileCapabilities profile={profile} />
                        </Route>
                        <Route exact path="/profile/api-keys">
                            <ProfileAPIKeys
                                profile={profile}
                                updateProfile={updateProfile}
                            />
                        </Route>
                        <Route exact path="/profile/reset-password">
                            <ProfileResetPassword profile={profile} />
                        </Route>
                        <Route exact path="/profile/oauth">
                            <ProfileOAuth profile={profile} />
                        </Route>
                    </Switch>
                </div>
            </div>
        </View>
    );
}
