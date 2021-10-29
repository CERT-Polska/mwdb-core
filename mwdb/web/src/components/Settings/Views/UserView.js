import React, { useCallback, useEffect, useState } from "react";
import { useParams, Switch, Link, useLocation } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { AdministrativeRoute, useViewAlert } from "@mwdb-web/commons/ui";

import UserDetails from "./UserDetails";
import UserResetPassword from "./UserResetPassword";
import ProfileAPIKeys from "../../Profile/Views/ProfileAPIKeys";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";
import UserSingleGroups from "./UserSingleGroups";

export default function UserView() {
    const location = useLocation();
    const { setAlert } = useViewAlert();
    const { login } = useParams();
    const [user, setUser] = useState({});

    async function updateUser() {
        try {
            const response = await api.getUser(login);
            setUser(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getUser = useCallback(updateUser, [login, setAlert]);

    useEffect(() => {
        getUser();
    }, [getUser]);

    if (!user) return [];

    return (
        <div className="container">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <strong>Account details: </strong>
                        {location.pathname.split("/").length > 4 ? (
                            <Link to={`/settings/user/${user.login}`}>
                                {user.login}
                            </Link>
                        ) : (
                            <span>{user.login}</span>
                        )}
                    </li>
                    {location.pathname.split("/").length > 4 && (
                        <li className="breadcrumb-item active">
                            <Switch>
                                <AdministrativeRoute path="/settings/user/:login/capabilities">
                                    Capabilities
                                </AdministrativeRoute>
                                <AdministrativeRoute path="/settings/user/:login/api-keys">
                                    API keys
                                </AdministrativeRoute>
                                <AdministrativeRoute path="/settings/user/:login/password">
                                    Reset password
                                </AdministrativeRoute>
                                <AdministrativeRoute path="/settings/user/:login/groups">
                                    Groups
                                </AdministrativeRoute>
                            </Switch>
                        </li>
                    )}
                </ol>
            </nav>
            <Switch>
                <AdministrativeRoute exact path="/settings/user/:login">
                    <UserDetails user={user} getUser={updateUser} />
                </AdministrativeRoute>
                <AdministrativeRoute
                    exact
                    path="/settings/user/:login/capabilities"
                >
                    <ProfileCapabilities profile={user} />
                </AdministrativeRoute>
                <AdministrativeRoute
                    exact
                    path="/settings/user/:login/api-keys"
                >
                    <ProfileAPIKeys profile={user} updateProfile={updateUser} />
                </AdministrativeRoute>
                <AdministrativeRoute
                    exact
                    path="/settings/user/:login/password"
                >
                    <UserResetPassword user={user} />
                </AdministrativeRoute>
                <AdministrativeRoute exact path="/settings/user/:login/groups">
                    <UserSingleGroups user={user} getUser={updateUser} />
                </AdministrativeRoute>
            </Switch>
        </div>
    );
}
