import React from "react";

import { fromPlugin } from "@mwdb-web/commons/extensions";

export let capabilitiesList = {
    manage_users: "Managing users and groups (system administration)",
    share_queried_objects: "Query for all objects in system",
    access_all_objects: "Has access to all new uploaded objects into system",
    sharing_objects: "Can share objects with all groups in system",
    adding_tags: "Can add tags",
    removing_tags: "Can remove tags",
    adding_comments: "Can add comments",
    removing_comments: "Can remove (all) comments",
    adding_parents: "Can specify parent of uploaded object",
    reading_all_attributes:
        "Has access to all attributes of object (including hidden)",
    adding_all_attributes: "Can add all attributes to object",
    managing_attributes: "Can define new attributes and manage them",
    removing_attributes: "Can remove attribute from objects",
    adding_configs: "Can upload configs",
    adding_blobs: "Can upload text blobs",
    unlimited_requests: "API requests are not rate-limited for this group",
    removing_objects: "Can remove objects",
};

for (let extraCapabilities of fromPlugin("capabilities")) {
    capabilitiesList = { ...capabilitiesList, ...extraCapabilities };
}

function CapabilitiesTable({profile}) {
    if(!profile.capabilities)
        return [];
    return (
        <table className="table table-bordered wrap-table">
            <tbody>
            {
                profile.capabilities.sort().map(cap => (
                    <tr>
                        <th className="col-1">
                            <span className="badge badge-success">
                                {cap}
                            </span>
                        </th>
                        <td className="col">
                            <div>
                                { capabilitiesList[cap] || "(no description)" }
                            </div>
                            <div>
                                {
                                    profile.groups.filter(
                                        group => group.capabilities.includes(cap)
                                    ).map(
                                        group => (
                                            <span className={`badge badge-${
                                                group.private ? "primary" : "secondary"
                                            }`}>
                                                {group.name}
                                            </span>
                                        )
                                    )
                                }
                            </div>
                        </td>
                    </tr>
                ))
            }
            </tbody>
        </table>
    )
}

export default function ProfileCapabilities({profile}) {
    return (
        <div>
            <h4>Account capabilities</h4>
            <CapabilitiesTable profile={profile} />
        </div>
    )
}