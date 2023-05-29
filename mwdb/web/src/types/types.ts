import { AxiosError } from "axios";

export enum Capability {
    manageUsers = "manage_users",
    shareQueriedObjects = "share_queried_objects",
    accessAllObjects = "access_all_objects",
    sharingWithAll = "sharing_with_all",
    accessUploaderInfo = "access_uploader_info",
    addingTags = "adding_tags",
    removingTags = "removing_tags",
    addingComments = "adding_comments",
    removingComments = "removing_comments",
    addingParents = "adding_parents",
    removingParents = "removing_parents",
    readingAllAttributes = "reading_all_attributes",
    addingAllAttributes = "adding_all_attributes",
    removingAttributes = "removing_attributes",
    addingFiles = "adding_files",
    addingConfigs = "adding_configs",
    addingBlobs = "adding_blobs",
    unlimitedRequests = "unlimited_requests",
    removingObjects = "removing_objects",
    manageProfile = "manage_profile",
    personalize = "personalize",
    kartonAssign = "karton_assign",
    kartonReanalyze = "karton_reanalyze",
    removingKarton = "karton_unassign",
    modify3rdPartySharing = "modify_3rd_party_sharing",
}

export type User = {
    login: string;
    groups: string[] | Group[];
    capabilities: Capability[];
    additional_info?: string;
    api_keys?: ApiKey[];
    disabled?: boolean;
    email?: string;
    feed_quality?: string;
    pending?: boolean;
    requested_on?: string | Date;
    provider?: null | string;
    token?: string;
    logged_on?: string | Date;
    registered_on?: string | Date;
    registrar_login?: string | Date;
    set_password_on?: string | Date;
};

export type Group = {
    admins: string[];
    capabilities: Capability[];
    default: boolean;
    immutable: boolean;
    name: string;
    private: boolean;
    users: string[];
    workspace: boolean;
};

export type ObjectType = "file" | "text_blob" | "static_config";

export type Attribute = {
    key: string;
    id: number;
    value: unknown;
};

export type AttributeDefinition = {
    description: string;
    example_value: string;
    hidden: boolean;
    key: string;
    label: string;
    rich_template: string;
    url_template: string;
};

export type Tag = {
    tag: string;
};

export type RelatedObject = {
    id: string;
    tags: Tag[];
    type: ObjectType;
    upload_time: string | Date;
};

export type ConfigType = "static" | "dynamic";

type ObjectCommonData = {
    attributes: Attribute[];
    children: RelatedObject[];
    favorite: boolean;
    id: string;
    parents: RelatedObject[];
    tags: Tag[];
    upload_time: string | Date;
};

export type ObjectData = ObjectCommonData & {
    alt_names: string[];
    crc32: string;
    file_name: string;
    file_size: number;
    file_type: string;
    latest_config: null;
    md5: string;
    sha1: string;
    sha256: string;
    sha512: string;
    ssdeep: string;
    type: "file";
};

export type ConfigData = ObjectCommonData & {
    cfg: object;
    config_type: ConfigType;
    family: string;
    type: "static_config";
};

export type BlobData = ObjectCommonData & {
    blob_name: string;
    blob_size: number;
    blob_type: string;
    content: string;
    last_seen: string | Date;
    latest_config: unknown;
    type: "text_blob";
};

export type ObjectListItem = {
    file_name: string;
    file_size: number;
    file_type: string;
    id: string;
    md5: string;
    sha1: string;
    sha256: string;
    tags: Tag[];
    type: "file";
    upload_time: string | Date;
};

export type ConfigListItem = {
    config_type: ConfigType;
    family: string;
    id: string;
    tags: Tag[];
    type: "static_config";
    upload_time: string | Date;
};

export type BlobListItem = {
    blob_name: string;
    blob_size: number;
    blob_type: string;
    id: string;
    last_seen: string | Date;
    type: "text_blob";
    tags: Tag[];
};

export type Comment = {
    author: string;
    comment: string;
    id: number;
    timestamp: string | Date;
};

export type Share = {
    access_reason: string;
    access_time: string | Date;
    group_name: string;
    reason_type: string;
    related_object_dhash: string;
    related_object_type: ObjectType;
    related_user_login: string;
};

export type Query = {
    id: number;
    name: string;
    query: string;
    type: ObjectType;
};

export type ApiKey = {
    id: string;
    issued_on: string | Date;
    issuer_login: string;
    name: string;
};

export type Family = {
    count: number;
    family: string;
    last_upload: string;
};

export type KartonAnalysis = {
    status: string;
    id: string;
    processing_in: Record<
        `additionalProp${number}`,
        {
            status: string[];
            received_from: string[];
        }
    >;
    arguments: Record<`additionalProp${number}`, string>;
    last_update: string | Date;
};

export type AxiosServerErrors = AxiosError<{
    message?: string;
    errors?: Record<string, string>;
}>;

export type TabContextValues = {
    tab?: string;
    subTab?: string;
    getTabLink: (tab: string, subtab?: string) => string;
    setComponent: (newComponent: React.ComponentType) => void;
    setActions: (actions: JSX.Element[]) => void;
};

export type ConfigContextValues = {
    config: Partial<ServerInfo>;
    configError: unknown;
    isReady: boolean;
    update: () => Promise<void>;
    pendingUsers: User[];
    getPendingUsers: () => Promise<void>;
};

export type AuthContextValues = {
    user: User;
    isAuthenticated: boolean;
    isAdmin: boolean;
    hasCapability: (cap: Capability) => boolean;
    refreshSession: () => Promise<void>;
    updateSession: (newSession: User) => void;
    logout: (error?: string) => void;
    oAuthLogout: () => Promise<any>;
};

export type GenericOrJSX<T> = T | JSX.Element;

export type ServerInfo = {
    request_timeout: number;
    is_karton_enabled: boolean;
    statement_timeout: number;
    is_oidc_enabled: boolean;
    is_authenticated: boolean;
    is_maintenance_set: boolean;
    recaptcha_site_key: string;
    file_upload_timeout: number;
    server_version: string;
    is_registration_enabled: boolean;
    instance_name: string;
    remotes: string[];
};
