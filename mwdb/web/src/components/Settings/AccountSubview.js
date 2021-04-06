import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, Route, Switch, useHistory, useParams } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { getErrorMessage } from "@mwdb-web/commons/ui";

import AccountProfile from "./AccountProfile";
import AccountCapabilities from "./AccountCapabilities";
import AccountResetPassword from "./AccountResetPassword";

export default function AccountSubview() {
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
                pathname: "/settings/account",
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
                    "/settings/account",
                    "/settings/user/:user"
                ]}/>
                <Route>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <Link to="/settings/account">Account settings</Link>
                            </li>
                            <li className="breadcrumb-item active">
                                <Switch>
                                    <Route path="/settings/account/capabilities">Capabilities</Route>
                                    <Route path="/settings/account/reset-password">Reset password</Route>
                                </Switch>
                            </li>
                        </ol>
                    </nav>
                </Route>
            </Switch>
            <Switch>
                <Route exact path={[
                    "/settings/account",
                    "/settings/user/:user"
                ]}>
                    <AccountProfile profile={profile}/>
                </Route>
                <Route exact path="/settings/account/capabilities">
                    <AccountCapabilities profile={profile}/>
                </Route>
                <Route exact path="/settings/account/reset-password">
                    <AccountResetPassword profile={profile}/>
                </Route>
            </Switch>
        </div>
    )
}