export type Capabality =
    | "personalize"
    | "share_queried_objects"
    | "adding_comments"
    | "manage_profile"
    | "removing_parents"
    | "adding_blobs"
    | "removing_tags"
    | "access_uploader_info"
    | "removing_comments"
    | "removing_objects"
    | "adding_all_attributes"
    | "unlimited_requests"
    | "karton_assign"
    | "karton_unassign"
    | "reading_all_attributes"
    | "adding_configs"
    | "adding_files"
    | "adding_tags"
    | "sharing_with_all"
    | "manage_users"
    | "karton_reanalyze"
    | "access_all_objects"
    | "removing_attributes"
    | "adding_parents";

export type User = {
    capabilities: Capabality[];
    groups: string[];
    login: string;
    provider: null | string;
    token: string;
};

export type Group = {
    admins: string[];
    capabilities: Capabality[];
    default: boolean;
    immutable: boolean;
    name: string;
    private: boolean;
    users: string[];
    workspace: boolean;
};

export type ObjectType = "file" | "blob" | "config";

export type Attribute = {
    key: string;
    id: number;
    value: unknown;
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
