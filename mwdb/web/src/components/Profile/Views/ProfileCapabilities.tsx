import { useOutletContext } from "react-router-dom";
import { useCheckCapabilities } from "@mwdb-web/commons/hooks";
import { CapabilitiesTable } from "../common/CapabilitiesTable";
import { CapabilitiesSelect } from "../common/CapabilitiesSelect";
import { Capability, Group, User } from "@mwdb-web/types/types";
import { ProfileOutletContext } from "@mwdb-web/types/context";

type Props = {
    profile?: User | Group;
    getData: () => Promise<void>;
};

export function ProfileCapabilities({ profile, getData }: Props) {
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
                Here is the list of {"groups" in profile ? "account" : "group"}{" "}
                superpowers:
            </p>
            {userHasCapabilities(Capability.manageUsers) && (
                <CapabilitiesSelect profile={profile} getData={getData} />
            )}
            <CapabilitiesTable profile={profile} />
        </div>
    );
}
