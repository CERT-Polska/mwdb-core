import { AxiosResponse } from "axios";
import {
    Attribute,
    AttributeDefinition,
    BlobData,
    BlobListItem,
    ConfigData,
    ConfigListItem,
    Family,
    Group,
    KartonAnalysis,
    ObjectData,
    ObjectListItem,
    Query,
    RelatedObject,
    ServerInfo,
    Share,
    Tag,
    User,
} from "./types";

export type Response<T> = Promise<AxiosResponse<T>>;

export type ServerInfoResponse = Response<{
    server_version: string;
    is_authenticated: boolean;
    instance_name: string;
    is_maintenance_set: boolean;
    is_registration_enabled: boolean;
    is_karton_enabled: boolean;
    is_oidc_enabled: boolean;
    is_3rd_party_sharing_consent_enabled: boolean;
    recaptcha_site_key: boolean;
    request_timeout: number;
    file_upload_timeout: number;
    statement_timeout: number;
}>;
export type Response<T, C = any> = Promise<AxiosResponse<T, C>>;

export type ServerInfoResponse = Response<ServerInfo>;

type ServerDocsInfo = {
    description: string;
    title: string;
    version: string;
};

type ServerDocsServer = {
    url: string;
    description: string;
};

export type ServerDocsResponse = Response<{
    components: object;
    info: ServerDocsInfo;
    paths: object;
    servers: ServerDocsServer[];
}>;

export type ServerAdminInfoResponse = Response<{
    active_plugins: object;
    plugins_enabled: boolean;
    rate_limit_enabled: boolean;
}>;

export type AuthLoginResponse = Response<User>;

export type AuthRefreshResponse = Response<User>;

export type AuthSetPasswordResponse = Response<{
    login: string;
}>;

export type AuthRequestPasswordChangeResponse = Response<{
    login: string;
}>;

export type AuthRecoverPasswordResponse = Response<{
    login: string;
}>;

export type AuthGroupsResponse = Response<Group>;

export type ApiKeyAddResponse = Response<{
    issuer_login: string;
    name: string;
    id: string;
    token: string;
    issued_on: string | Date;
}>;

export type ApiKeyRemoveResponse = Response<null>;

export type GetObjectResponse = Response<ObjectData | ConfigData | BlobData>;

export type GetObjectListResponse = Response<
    ObjectListItem[] | ConfigListItem[] | BlobListItem[]
>;

export type GetObjectCountResponse = Response<{
    count: number;
}>;

export type GetTagsResponse = Response<Tag[]>;

export type GetShareInfoResponse = Response<string[]>;

export type GetObjectTagsResponse = Response<Tag[]>;

export type GetObjectCommentsResponse = Response<Comment[]>;

export type GetObjectRelationsResponse = Response<{
    children: RelatedObject[];
    parents: RelatedObject[];
}>;

export type AddObjectRelationResponse = Response<null>;

export type RemoveObjectRelationResponse = Response<null>;

export type GetObjectSharesResponse = Response<{
    groups: string[];
    shares: Share[];
}>;

export type GetObjectAttributesResponse = Response<Attribute[]>;

export type RemoveObjectResponse = Response<null>;

export type AddObjectTagResponse = Response<Tag[]>;

export type RemoveObjectTagResponse = Response<Tag[]>;

export type AddObjectCommentResponse = Response<Comment>;

export type RemoveObjectCommentResponse = Response<null>;

export type AddObjectAttributeResponse = Response<Attribute[]>;

export type RemoveObjectAttributeResponse = Response<Attribute[]>;

export type AddObjectFavoriteResponse = Response<null>;

export type RemoveObjectFavoriteResponse = Response<null>;

export type ShareObjectWithResponse = Response<Share[]>;

export type AddQuickQueryResponse = Response<Query>;

export type GetQuickQueriesResponse = Response<Query[]>;

export type DeleteQuickQueryResponse = Response<null>;

export type GetGroupsResponse = Response<Group[]>;

export type GetGroupResponse = Response<Group>;

export type RegisterGroupResponse = Response<{
    name: string;
}>;

export type UpdateGroupResponse = Response<{
    name: string;
}>;

export type RemoveGroupResponse = Response<{
    name: string;
}>;

export type AddGroupMemberResponse = Response<{
    name: string;
}>;

export type RemoveGroupMemberResponse = Response<{
    name: string;
}>;
export type SetGroupAdminResponse = Response<{
    name: string;
}>;

export type GetUsersResponse = Response<User[]>;

export type GetPendingUsersResponse = Response<{ users: User[] }>;

export type AcceptPendingUserResponse = Response<{
    login: string;
}>;

export type RejectPendingUserResponse = Response<{
    login: string;
}>;

export type GetUserResponse = Response<User>;

export type GetUserProfileResponse = Response<User>;

export type GenerateSetPasswordResponse = Response<{
    token: string;
    login: string;
}>;

export type UserRequestPasswordChangeResponse = Response<{
    login: string;
}>;

export type SetUserDisabledResponse = Response<{
    login: string;
}>;

export type CreateUserResponse = Response<{
    login: string;
}>;

export type RegisterUserResponse = Response<{
    login: string;
}>;

export type UpdateUserRequest = {
    login: string;
    email?: string;
    additionalInfo?: string;
    feedQuality?: string;
};

export type UpdateUserResponse = Response<User>;

export type RemoveUserResponse = Response<null>;

export type GetAttributeDefinitionsResponse = Response<AttributeDefinition[]>;

export type GetAttributeDefinitionResponse = Response<AttributeDefinition>;

export type AddAttributeDefinitionReguest = {
    key: string;
    label: string;
    description: string;
    hidden: boolean;
};

export type AddAttributeDefinitionResponse = Response<AttributeDefinition>;

export type UpdateAttributeDefinitionRequest = AttributeDefinition;

export type UpdateAttributeDefinitionResponse = Response<AttributeDefinition>;

export type RemoveAttributeDefinitionResponse = Response<null>;

export type DownloadFileResponse = Response<{ token: string }>;

export type UploadFileResponse = Response<ObjectData>;

export type GetRemoteNamesResponse = Response<{
    remotes: string[];
}>;

export type PushObjectRemoteResponse = Response<null>;

export type PullObjectRemoteResponse = Response<null>;

export type GetConfigStatsResponse = Response<{
    families: Family[];
}>;

export type GetRemoteObjectResponse = Response<
    ObjectData | ConfigData | BlobData
>;

export type GetRemoteObjectListResponse = Response<
    ObjectData[] | ConfigData[] | BlobData[]
>;

export type GetRemoteObjectCountResponse = Response<{
    count: number;
}>;

export type GetRemoteObjectTagsResponse = Response<Tag[]>;

export type GetRemoteObjectCommentsResponse = Response<Comment[]>;

export type GetRemoteObjectRelationsResponse = Response<{
    children: RelatedObject[];
    parents: RelatedObject[];
}>;

export type GetRemoteObjectSharesResponse = Response<{
    groups: string[];
    shares: Share[];
}>;

export type GetRemoteObjectAttributesResponse = Response<Attribute[]>;

export type DownloadRemoteFileResponse = Response<{ token: string }>;

export type GetKartonAnalysesListResponse = Response<{
    analyses: KartonAnalysis[];
    status: string;
}>;

export type GetKartonAnalysisStatusResponse = Response<KartonAnalysis>;

export type ResubmitKartonAnalysisResponse = Response<{
    analyses: KartonAnalysis[];
    status: string;
}>;

export type RemoveKartonAnalysisFromObjectResponse = Response<null>;

export type EnableSharing3rdPartyResponse = Response<null>;
