import React from "react";

import { capabilitiesList } from "@mwdb-web/commons/auth";
import { GroupBadge } from "@mwdb-web/commons/ui";

function CapabilitiesTable({ profile }) {
    if (!profile.capabilities) return [];
    return (
        <table className="table table-bordered wrap-table">
            <tbody>
                {profile.capabilities.sort().map((cap) => (
                    <tr>
                        <th className="col-1">
                            <span className="badge badge-success">{cap}</span>
                        </th>
                        <td className="col">
                            <div>
                                {capabilitiesList[cap] || "(no description)"}
                            </div>
                            <div>
                                {profile.groups
                                    .filter((group) =>
                                        group.capabilities.includes(cap)
                                    )
                                    .map((group) => (
                                        <GroupBadge group={group} />
                                    ))}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function ProfileCapabilities({ profile }) {
    return (
        <div className="container">
            <CapabilitiesTable profile={profile} />
        </div>
    );
}
