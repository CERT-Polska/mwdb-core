import { useOutletContext } from "react-router-dom";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";
import { UserOutletContext } from "@mwdb-web/types/context";

export function GroupCapabilitiesView() {
    const { group, getGroup }: UserOutletContext = useOutletContext();
    return <ProfileCapabilities profile={group} getData={getGroup} />;
}
