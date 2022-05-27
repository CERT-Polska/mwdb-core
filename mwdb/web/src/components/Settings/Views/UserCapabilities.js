import React from "react";
import { useOutletContext } from "react-router-dom-v5-compat";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";

export default function UserCapabilities() {
    const { user } = useOutletContext();
    return <ProfileCapabilities profile={user} />;
}
