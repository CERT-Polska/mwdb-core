import React from "react";
import { useOutletContext } from "react-router-dom-v5-compat";

import { capabilitiesList } from "@mwdb-web/commons/auth";
import { GroupBadge } from "@mwdb-web/commons/ui";

function CapabilitiesTable({ profile }) {
    if (!profile.capabilities) return [];
    return (
        <table className="table table-bordered wrap-table">
            <tbody>
                {profile.capabilities.sort().map((cap) => (
                    <tr>
                        <th>
                            <span className="badge badge-success">{cap}</span>
                        </th>
                        <td>
                            <div>
                                {capabilitiesList[cap] || "(no description)"}
                            </div>
                            <div>
                                {profile.groups && (
                                    <span>
                                        <small className="text-muted">
                                            Got from:
                                        </small>
                                        {profile.groups
                                            .filter((group) =>
                                                group.capabilities.includes(cap)
                                            )
                                            .map((group) => (
                                                <GroupBadge
                                                    group={group}
                                                    clickable
                                                />
                                            ))}
                                    </span>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function ProfileCapabilities({ profile }) {
    // Component is reused by Settings
    const outletContext = useOutletContext();
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
            <CapabilitiesTable profile={profile} />
        </div>
    );
}
