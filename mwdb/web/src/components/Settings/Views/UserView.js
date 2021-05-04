import React, { useCallback, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import ProfileAPIKeys from "../../Profile/Views/ProfileAPIKeys";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";
import { AdministrativeRoute, getErrorMessage } from "@mwdb-web/commons/ui";
import UserDetails from "./UserDetails";

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
        <React.Fragment>
            <AdministrativeRoute exact path="/admin/user/:login">
                <UserDetails user={user} getUser={updateUser} />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/admin/user/:login/capabilities">
                <ProfileCapabilities profile={user} />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/admin/user/:login/api-keys">
                <ProfileAPIKeys profile={user} updateProfile={updateUser} />
            </AdministrativeRoute>
        </React.Fragment>
    );
}
