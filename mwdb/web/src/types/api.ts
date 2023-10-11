import { AxiosResponse } from "axios";
import {
    ApiKey,
    Attribute,
    AttributeDefinition,
    BlobData,
    BlobListItem,
    Comment,
    ConfigData,
    ConfigListItem,
    Family,
    FileListItem,
    Group,
    KartonAnalysis,
    ObjectData,
    ObjectListItem,
    ObjectOrConfigOrBlobData,
    Provider,
    Query,
    RelatedObject,
    ServerAdminInfo,
    ServerInfo,
    Share,
    Tag,
    User,
} from "./types";

export type Response<T> = Promise<AxiosResponse<T>>;

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

export type ServerAdminInfoResponse = Response<ServerAdminInfo>;

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

export type AuthGroupsResponse = Response<{ groups: Group[] }>;

export type ApiKeyAddResponse = Response<ApiKey>;

export type ApiKeyRemoveResponse = Response<null>;

export type GetObjectResponse = Response<ObjectOrConfigOrBlobData>;

export type GetObjectListResponse = Response<{
    files?: FileListItem[];
    configs?: ConfigListItem[];
    blobs?: BlobListItem[];
    objects?: ObjectListItem[];
}>;

export type GetObjectCountResponse = Response<{
    count: number;
}>;

export type GetTagsResponse = Response<Tag[]>;

export type GetShareInfoResponse = Response<{ groups: string[] }>;

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

export type GetObjectAttributesResponse = Response<{ attributes: Attribute[] }>;

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

export type GetGroupsResponse = Response<{ groups: Group[] }>;

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

export type GetUsersResponse = Response<{ users: User[] }>;

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

export type GetAttributeDefinitionsResponse = Response<{
    attribute_definitions: AttributeDefinition[];
}>;

export type GetAttributeDefinitionResponse = Response<AttributeDefinition>;

export type AddAttributeDefinitionReguest = {
    key: string;
    label?: string;
    description?: string;
    hidden?: boolean;
};

export type AddAttributeDefinitionResponse = Response<AttributeDefinition>;

export type UpdateAttributeDefinitionRequest = Partial<AttributeDefinition>;

export type UpdateAttributeDefinitionResponse = Response<AttributeDefinition>;

export type RemoveAttributeDefinitionResponse = Response<null>;

export type GetAttributePermissionsResponse = Response<{
    attribute_permissions: {
        can_read: boolean;
        can_set: boolean;
        group_name: string;
    }[];
}>;

export type DownloadFileResponse = Response<ArrayBuffer>;

export type UploadFileResponse = Response<ObjectData>;

export type UploadCommons = {
    parent?: string;
    shareWith: string;
    attributes: Attribute[];
    share3rdParty?: boolean;
};

export type UploadFileRequest = {
    file: File | null;
    group: string;
    fileUploadTimeout?: number;
} & UploadCommons;

export type UploadConfigRequest = {
    cfg?: string;
    family: string;
    config_type?: string;
} & UploadCommons;

export type UploadConfigResponse = Response<ConfigData>;

export type UploadBlobRequest = {
    content: string;
    type: string;
    name: string;
    group: string;
} & UploadCommons;

export type UploadBlobResponse = Response<BlobData>;

export type GetRemoteNamesResponse = Response<{
    remotes: string[];
}>;

export type PushObjectRemoteResponse = Response<null>;

export type PullObjectRemoteResponse = Response<null>;

export type GetConfigStatsResponse = Response<{
    families: Family[];
}>;

export type GetRemoteObjectResponse = Response<ObjectOrConfigOrBlobData>;

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

export type GetRemoteObjectAttributesResponse = Response<{
    attributes: Attribute[];
}>;

export type DownloadRemoteFileResponse = Response<ArrayBuffer>;

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

export type OauthGetProvidersResponse = Response<{
    providers: string[];
}>;

export type OauthGetIdentitiesResponse = Response<{
    providers: string[];
}>;

export type OauthGetSingleProviderResponse = Response<Provider>;

export type OauthUpdateSingleProviderResponse = Response<string>;

export type OauthRemoveSingleProviderResponse = Response<null>;

export type OauthGetLogoutLinkResponse = Response<{
    url: string;
}>;
