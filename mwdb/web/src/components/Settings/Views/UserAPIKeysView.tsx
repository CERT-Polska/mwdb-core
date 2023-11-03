import { useOutletContext } from "react-router-dom";
import { ProfileAPIKeys } from "../../Profile/Views/ProfileAPIKeys";
import { UserOutletContext } from "@mwdb-web/types/context";

export function UserAPIKeysView() {
    const { user, getUser }: UserOutletContext = useOutletContext();
    return <ProfileAPIKeys profile={user} getProfile={getUser} />;
}
