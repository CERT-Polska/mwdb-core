import { useOutletContext } from "react-router-dom";
import { Capabilities } from "@mwdb-web/commons/auth";
import { useCheckCapabilities } from "@mwdb-web/commons/hooks";
import { CapabilitiesTable } from "../common/CapabilitiesTable";
import { CapabilitiesSelect } from "../common/CapabilitiesSelect";
import { User } from "@mwdb-web/types/types";
import { ProfileOutletContext } from "@mwdb-web/types/context";

type Props = {
    profile?: User;
    getData: () => Promise<void>;
};

export default function ProfileCapabilities({ profile, getData }: Props) {
    // Component is reused by Settings
    const outletContext: ProfileOutletContext = useOutletContext();
    const { userHasCapabilities } = useCheckCapabilities();

    if (profile === undefined) {
        profile = outletContext.profile;
    }

    return (
        <div className="container">
            <h2>Capabilities</h2>
            <p className="lead">
                Here is the list of {profile.groups ? "account" : "group"}{" "}
                superpowers:
            </p>
            {userHasCapabilities(Capabilities.manageUsers) && (
                <CapabilitiesSelect profile={profile} getData={getData} />
            )}
            <CapabilitiesTable profile={profile} />
        </div>
    );
}
