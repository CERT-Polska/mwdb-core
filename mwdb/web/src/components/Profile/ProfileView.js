import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    NavLink,
    Route,
    Switch,
    useHistory,
    useParams,
} from "react-router-dom";

import { faUserCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View, getErrorMessage } from "@mwdb-web/commons/ui";

import ProfileDetails from "./Views/ProfileDetails";
import ProfileAPIKeys from "./Views/ProfileAPIKeys";
import ProfileCapabilities from "./Views/ProfileCapabilities";
import ProfileResetPassword from "./Views/ProfileResetPassword";
import ProfileGroup from "./Views/ProfileGroup";
import ProfileGroups from "./Views/ProfileGroups";

function ProfileNav() {
    return (
        <div>
            <strong>
                <FontAwesomeIcon icon={faUserCog} /> Profile
            </strong>
            <div className="nav flex-column">
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
            </div>
        </div>
    );
}

export default function ProfileView() {
    const auth = useContext(AuthContext);
    const history = useHistory();
    const user = useParams().user || auth.user.login;
    const [profile, setProfile] = useState();

    async function updateProfile() {
        try {
            const response = await api.getUserProfile(user);
            setProfile(response.data);
        } catch (error) {
            history.push({
                pathname: "/profile",
                state: { error: getErrorMessage(error) },
            });
        }
    }

    const getProfile = useCallback(updateProfile, [user]);

    useEffect(() => {
        getProfile();
    }, [getProfile]);

    if (!profile || profile.login !== user) return [];

    return (
        <View ident="profile" fluid>
            <div className="row">
                <div className="col-2">
                    <ProfileNav />
                </div>
                <div className="col-8">
                    <Switch>
                        <Route exact path={["/profile", "/profile/user/:user"]}>
                            <ProfileDetails profile={profile} />
                        </Route>
                        <Route exact path="/profile/group/:group">
                            <ProfileGroup profile={profile} />
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
                    </Switch>
                </div>
            </div>
        </View>
    );
}
