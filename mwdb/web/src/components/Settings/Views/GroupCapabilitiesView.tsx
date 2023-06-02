import { useOutletContext } from "react-router-dom";
import { ProfileCapabilities } from "../../Profile/Views/ProfileCapabilities";
import { GroupOutletContext } from "@mwdb-web/types/context";

export function GroupCapabilitiesView() {
    const { group, getGroup }: GroupOutletContext = useOutletContext();
    return <ProfileCapabilities profile={group} getData={getGroup} />;
}
