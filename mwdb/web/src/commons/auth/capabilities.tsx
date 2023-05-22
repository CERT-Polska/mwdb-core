import { afterPluginsLoaded, fromPlugins } from "../plugins";

type CapabilityObjectType = {
    manageUsers: "manage_users";
    shareQueriedObjects: "share_queried_objects";
    accessAllObjects: "access_all_objects";
    sharingWithAll: "sharing_with_all";
    accessUploaderInfo: "access_uploader_info";
    addingTags: "adding_tags";
    removingTags: "removing_tags";
    addingComments: "adding_comments";
    removingComments: "removing_comments";
    addingParents: "adding_parents";
    removingParents: "removing_parents";
    readingAllAttributes: "reading_all_attributes";
    addingAllAttributes: "adding_all_attributes";
    removingAttributes: "removing_attributes";
    addingFiles: "adding_files";
    addingConfigs: "adding_configs";
    addingBlobs: "adding_blobs";
    unlimitedRequests: "unlimited_requests";
    removingObjects: "removing_objects";
    manageProfile: "manage_profile";
    personalize: "personalize";
    kartonAssign: "karton_assign";
    kartonReanalyze: "karton_reanalyze";
    removingKarton: "karton_unassign";
    modify3rdPartySharing: "modify_3rd_party_sharing";
};

export const Capabilities: CapabilityObjectType = {
    manageUsers: "manage_users",
    shareQueriedObjects: "share_queried_objects",
    accessAllObjects: "access_all_objects",
    sharingWithAll: "sharing_with_all",
    accessUploaderInfo: "access_uploader_info",
    addingTags: "adding_tags",
    removingTags: "removing_tags",
    addingComments: "adding_comments",
    removingComments: "removing_comments",
    addingParents: "adding_parents",
    removingParents: "removing_parents",
    readingAllAttributes: "reading_all_attributes",
    addingAllAttributes: "adding_all_attributes",
    removingAttributes: "removing_attributes",
    addingFiles: "adding_files",
    addingConfigs: "adding_configs",
    addingBlobs: "adding_blobs",
    unlimitedRequests: "unlimited_requests",
    removingObjects: "removing_objects",
    manageProfile: "manage_profile",
    personalize: "personalize",
    kartonAssign: "karton_assign",
    kartonReanalyze: "karton_reanalyze",
    removingKarton: "karton_unassign",
    modify3rdPartySharing: "modify_3rd_party_sharing",
};

export let capabilitiesList: Record<
    CapabilityObjectType[keyof CapabilityObjectType],
    string
> = {
    [Capabilities.manageUsers]:
        "Managing users and groups (system administration)",
    [Capabilities.shareQueriedObjects]: "Query for all objects in system",
    [Capabilities.accessAllObjects]:
        "Has access to all new uploaded objects into system",
    [Capabilities.sharingWithAll]:
        "Can share objects with all groups in system",
    [Capabilities.accessUploaderInfo]:
        "Can view who uploaded object and filter by uploader",
    [Capabilities.addingTags]: "Can add tags",
    [Capabilities.removingTags]: "Can remove tags",
    [Capabilities.addingComments]: "Can add comments",
    [Capabilities.removingComments]: "Can remove (all) comments",
    [Capabilities.addingParents]: "Can specify parent of uploaded object",
    [Capabilities.removingParents]:
        "Can remove parent of object and inherited permissions from that relation",
    [Capabilities.readingAllAttributes]:
        "Has access to all attributes of object (including hidden)",
    [Capabilities.addingAllAttributes]: "Can add all attributes to object",
    [Capabilities.removingAttributes]: "Can remove attribute from objects",
    [Capabilities.addingFiles]: "Can upload files",
    [Capabilities.addingConfigs]: "Can upload configs",
    [Capabilities.addingBlobs]: "Can upload text blobs",
    [Capabilities.unlimitedRequests]:
        "API requests are not rate-limited for this group",
    [Capabilities.removingObjects]: "Can remove objects",
    [Capabilities.manageProfile]: "Can manage own profile",
    [Capabilities.personalize]:
        "Can mark favorites and manage own quick queries",
    [Capabilities.kartonAssign]:
        "Can assign existing analysis to the object (required by karton-mwdb-reporter)",
    [Capabilities.kartonReanalyze]: "Can resubmit any object for analysis",
    [Capabilities.removingKarton]: "Can remove analysis from object",
    [Capabilities.modify3rdPartySharing]:
        "Can mark objects as shareable with 3rd parties",
};

afterPluginsLoaded(() => {
    for (let extraCapabilities of fromPlugins("capabilities")) {
        capabilitiesList = { ...capabilitiesList, ...extraCapabilities };
    }
});
