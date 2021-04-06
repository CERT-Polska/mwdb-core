import { fromPlugin } from "../extensions";

export const Capability = {
    manageUsers: "manage_users",
    shareQueriedObjects: "share_queried_objects",
    accessAllObjects: "access_all_objects",
    sharingObjects: "sharing_objects",
    addingTags: "adding_tags",
    removingTags: "removing_tags",
    addingComments: "adding_comments",
    removingComments: "removing_comments",
    addingParents: "adding_parents",
    readingAllAttributes: "reading_all_attributes",
    addingAllAttributes: "adding_all_attributes",
    managingAttributes: "managing_attributes",
    removingAttributes: "removing_attributes",
    addingFiles: "adding_files",
    addingConfigs: "adding_configs",
    addingBlobs: "adding_blobs",
    unlimitedRequests: "unlimited_requests",
    removingObjects: "removing_objects",
};

export let capabilitiesList = {
    [Capability.manageUsers]:
        "Managing users and groups (system administration)",
    [Capability.shareQueriedObjects]: "Query for all objects in system",
    [Capability.accessAllObjects]:
        "Has access to all new uploaded objects into system",
    [Capability.sharingObjects]: "Can share objects with all groups in system",
    [Capability.addingTags]: "Can add tags",
    [Capability.removingTags]: "Can remove tags",
    [Capability.addingComments]: "Can add comments",
    [Capability.removingComments]: "Can remove (all) comments",
    [Capability.addingParents]: "Can specify parent of uploaded object",
    [Capability.readingAllAttributes]:
        "Has access to all attributes of object (including hidden)",
    [Capability.addingAllAttributes]: "Can add all attributes to object",
    [Capability.managingAttributes]:
        "Can define new attributes and manage them",
    [Capability.removingAttributes]: "Can remove attribute from objects",
    [Capability.addingFiles]: "Can upload files",
    [Capability.addingConfigs]: "Can upload configs",
    [Capability.addingBlobs]: "Can upload text blobs",
    [Capability.unlimitedRequests]:
        "API requests are not rate-limited for this group",
    [Capability.removingObjects]: "Can remove objects",
};

for (let extraCapabilities of fromPlugin("capabilities")) {
    capabilitiesList = { ...capabilitiesList, ...extraCapabilities };
}
