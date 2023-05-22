import { useOutletContext } from "react-router-dom";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";
import { UserOutletContext } from "@mwdb-web/types/context";

export function GroupCapabilitiesView() {
    //TODO: fix before review
    const { group, getGroup }: any = useOutletContext();
    console.log(group);
    return <ProfileCapabilities profile={group} getData={getGroup} />;
}
