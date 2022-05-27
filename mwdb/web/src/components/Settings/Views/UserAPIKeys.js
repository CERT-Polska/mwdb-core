import React from "react";
import { useOutletContext } from "react-router-dom";
import ProfileAPIKeys from "../../Profile/Views/ProfileAPIKeys";

export default function UserAPIKeys() {
    const { user, getUser } = useOutletContext();
    return <ProfileAPIKeys profile={user} getProfile={getUser} />;
}
