import React from "react";
import { useOutletContext } from "react-router-dom";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";

export default function GroupCapabilities() {
    const { group, getGroup } = useOutletContext();
    return <ProfileCapabilities profile={group} getData={getGroup} />;
}
