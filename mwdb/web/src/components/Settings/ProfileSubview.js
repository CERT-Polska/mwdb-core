import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, Route, Switch, useHistory, useParams } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { getErrorMessage } from "@mwdb-web/commons/ui";

import ProfileSettings from "./ProfileSettings";
import ProfileAPIKeys from "./ProfileAPIKeys";
import ProfileCapabilities from "./ProfileCapabilities";
import ProfileResetPassword from "./ProfileResetPassword";

export default function ProfileSubview() {
    const auth = useContext(AuthContext);
    const history = useHistory();
    const user = useParams().user || auth.user.login;
    const [ profile, setProfile ] = useState();

    async function updateProfile() {
        try {
            const response = await api.getUserProfile(
                user
            );
            setProfile(response.data);
        } catch (error) {
            history.push({
                pathname: "/settings/profile",
                state: {error: getErrorMessage(error)}
            })
        }
    }

    const getProfile = useCallback(updateProfile, [user]);

    useEffect(() => {
        getProfile();
    }, [getProfile]);

    if(!profile)
        return [];

    return (
        <div>
            <Switch>
                <Route exact path={[
                    "/settings/profile",
                    "/settings/user/:user"
                ]}/>
                <Route>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <Link to="/settings/profile">Profile settings</Link>
                            </li>
                            <li className="breadcrumb-item active">
                                <Switch>
                                    <Route path="/settings/profile/capabilities">Capabilities</Route>
                                    <Route path="/settings/profile/api-keys">API keys</Route>
                                    <Route path="/settings/profile/reset-password">Reset password</Route>
                                </Switch>
                            </li>
                        </ol>
                    </nav>
                </Route>
            </Switch>
            <Switch>
                <Route exact path={[
                    "/settings/profile",
                    "/settings/user/:user"
                ]}>
                    <ProfileSettings profile={profile}/>
                </Route>
                <Route exact path="/settings/profile/capabilities">
                    <ProfileCapabilities profile={profile}/>
                </Route>
                <Route exact path="/settings/profile/api-keys">
                    <ProfileAPIKeys profile={profile} updateProfile={updateProfile}/>
                </Route>
                <Route exact path="/settings/profile/reset-password">
                    <ProfileResetPassword profile={profile}/>
                </Route>
            </Switch>
        </div>
    )
}