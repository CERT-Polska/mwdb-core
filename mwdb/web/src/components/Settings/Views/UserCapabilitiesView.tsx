import { useOutletContext } from "react-router-dom";
import { ProfileCapabilities } from "../../Profile/Views/ProfileCapabilities";
import { UserOutletContext } from "@mwdb-web/types/context";

export function UserCapabilitiesView() {
    const { user, getUser }: UserOutletContext = useOutletContext();
    return <ProfileCapabilities profile={user} getData={getUser} />;
}
