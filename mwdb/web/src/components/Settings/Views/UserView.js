import React, { useCallback, useEffect, useState } from "react";
import { useHistory, useParams, Switch, Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { AdministrativeRoute, getErrorMessage } from "@mwdb-web/commons/ui";

import UserDetails from "./UserDetails";
import UserResetPassword from "./UserResetPassword";
import ProfileAPIKeys from "../../Profile/Views/ProfileAPIKeys";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";
import UserSingleGroups from "./UserSingleGroups";

export default function UserView() {
    const history = useHistory();
    const { login } = useParams();
    const [user, setUser] = useState({});

    async function updateUser() {
        try {
            const response = await api.getUser(login);
            setUser(response.data);
        } catch (error) {
            history.push({
                pathname: `/admin/user/${user.login}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }

    const getUser = useCallback(updateUser, [login]);

    useEffect(() => {
        getUser();
    }, [getUser]);

    if (!user) return [];

    return (
        <div className="container">
            <Switch>
                <AdministrativeRoute exact path="/admin/user/:login" />
                <AdministrativeRoute>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <Link to={`/admin/user/${user.login}`}>
                                    {user.login}
                                </Link>
                            </li>
                            <li className="breadcrumb-item active">
                                <Switch>
                                    <AdministrativeRoute path="/admin/user/:login/capabilities">
                                        Capabilities
                                    </AdministrativeRoute>
                                    <AdministrativeRoute path="/admin/user/:login/api-keys">
                                        API keys
                                    </AdministrativeRoute>
                                    <AdministrativeRoute path="/admin/user/:login/password">
                                        Reset password
                                    </AdministrativeRoute>
                                    <AdministrativeRoute path="/admin/user/:login/groups">
                                        Groups
                                    </AdministrativeRoute>
                                </Switch>
                            </li>
                        </ol>
                    </nav>
                </AdministrativeRoute>
            </Switch>
            <Switch>
                <AdministrativeRoute exact path="/admin/user/:login">
                    <UserDetails user={user} getUser={updateUser} />
                </AdministrativeRoute>
                <AdministrativeRoute
                    exact
                    path="/admin/user/:login/capabilities"
                >
                    <ProfileCapabilities profile={user} />
                </AdministrativeRoute>
                <AdministrativeRoute exact path="/admin/user/:login/api-keys">
                    <ProfileAPIKeys profile={user} updateProfile={updateUser} />
                </AdministrativeRoute>
                <AdministrativeRoute exact path="/admin/user/:login/password">
                    <UserResetPassword user={user} />
                </AdministrativeRoute>
                <AdministrativeRoute exact path="/admin/user/:login/groups">
                    <UserSingleGroups user={user} getUser={updateUser} />
                </AdministrativeRoute>
            </Switch>
        </div>
    );
}
