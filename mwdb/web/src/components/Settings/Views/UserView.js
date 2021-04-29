import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import ProfileAPIKeys from "../../Profile/Views/ProfileAPIKeys";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";
import { AdministrativeRoute } from "@mwdb-web/commons/ui";
import UserDetails from "./UserDetails";
import UserManageAccount from "./UserManageAccount";

export default function UserView() {
    const { login } = useParams();
    const [user, setUser] = useState({});

    async function updateUser() {
        try {
            const response = await api.getUser(login);
            setUser(response.data);
        } catch (error) {
            console.log(error);
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
                <UserDetails user={user} />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/admin/user/:login/manage">
                <UserManageAccount user={user} updateUser={updateUser} />
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
