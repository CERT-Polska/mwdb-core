import React from "react";
import { useOutletContext } from "react-router-dom";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";

export default function UserCapabilities() {
    const { user, getUser } = useOutletContext();
    return <ProfileCapabilities profile={user} getData={getUser} />;
}
