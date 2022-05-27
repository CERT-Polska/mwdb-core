import React from "react";
import { useOutletContext } from "react-router-dom-v5-compat";
import ProfileAPIKeys from "../../Profile/Views/ProfileAPIKeys";

export default function UserAPIKeys() {
    const { user, getUser } = useOutletContext();
    return <ProfileAPIKeys profile={user} getProfile={getUser} />;
}
