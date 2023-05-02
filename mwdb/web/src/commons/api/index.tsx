import {
    ApiKeyAddResponse,
    ApiKeyRemoveResponse,
    AuthGrupsResponse,
    AuthLoginResponse,
    AuthRecoverPasswordResponse,
    AuthRefreshResponse,
    AuthRequestPasswordChangeResponse,
    AuthSetPasswordResponse,
    GetObjectResponse,
    ServerAdminInfoResponse,
    ServerDocsResponse,
    ServerInfoResponse,
} from "@mwdb-web/types/api";
import { ObjectType } from "@mwdb-web/types/types";
import Axios from "axios";
import React from "react";

export type UpdateAttributeDefinitionParams = {
    key: string;
    label: string;
    description: string;
    url_template: string;
    rich_template: string;
    example_value: string;
    hidden: boolean;
};

function getApiForEnvironment() {
    // Default API endpoint
    return "/api";
}

const axios = Axios.create({
    baseURL: getApiForEnvironment(),
    timeout: 8000,
    transformResponse: [
        function (data, headers) {
            /**
             * Axios is trying to transform all responses to JSON by default
             * Fortunately we can override this behavior, checking Content-Type first
             */
            if (
                headers &&
                typeof data === "string" &&
                headers["content-type"] !== "application/octet-stream"
            ) {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    /* ignore */
                }
            }
            return data;
        },
    ],
});

function getServerDocs(): ServerDocsResponse {
    return axios.get("/docs");
}

function getServerInfo(): ServerInfoResponse {
    return axios.get("/server");
}

function getServerAdminInfo(): ServerAdminInfoResponse {
    return axios.get("/server/admin");
}

function authLogin(login: string, password: string): AuthLoginResponse {
    return axios.post("/auth/login", { login, password });
}

function authRefresh(): AuthRefreshResponse {
    return axios.post("/auth/refresh");
}

function authSetPassword(
    token: string,
    password: string
): AuthSetPasswordResponse {
    return axios.post(`/auth/change_password`, { token, password });
}

function authRequestPasswordChange(): AuthRequestPasswordChangeResponse {
    return axios.post(`/auth/request_password_change`);
}

function authRecoverPassword(
    login: string,
    email: string,
    recaptcha: string
): AuthRecoverPasswordResponse {
    return axios.post("/auth/recover_password", { login, email, recaptcha });
}

function authGroups(): AuthGrupsResponse {
    return axios.get("/auth/groups");
}

//TODO: check if oauth is still exists i got 404 for example to get provider
function oauthAuthenticate(provider: string) {
    return axios.post(`/oauth/${provider}/authenticate`);
}

function oauthCallback(
    provider: string,
    action: string,
    code: string,
    nonce: string,
    state: string
) {
    return axios.post(`/oauth/${provider}/${action}`, {
        code,
        nonce,
        state,
    });
}

function oauthRegisterProvider(
    name: string,
    client_id: number,
    client_secret: string,
    authorization_endpoint: string,
    token_endpoint: string,
    userinfo_endpoint: string,
    jwks_endpoint: string,
    logout_endpoint: string
) {
    return axios.post(`/oauth`, {
        name,
        client_id,
        client_secret,
        authorization_endpoint,
        token_endpoint,
        userinfo_endpoint,
        jwks_endpoint,
        logout_endpoint,
    });
}

function oauthGetProviders() {
    return axios.get("/oauth");
}

function oauthGetSingleProvider(provider_name: string) {
    return axios.get(`/oauth/${provider_name}`);
}

function oauthUpdateSingleProvider(name: string, value: string) {
    return axios.put(`/oauth/${name}`, value);
}

function oauthRemoveSingleProvider(name: string) {
    return axios.delete(`/oauth/${name}`);
}

function oauthGetIdentities() {
    return axios.get("/oauth/identities");
}

function oauthGetLogoutLink(provider: string) {
    return axios.get(`/oauth/${provider}/logout`);
}

function apiKeyAdd(login: string, name: string): ApiKeyAddResponse {
    return axios.post(`/user/${login}/api_key`, { name });
}

function apiKeyRemove(key_id: number): ApiKeyRemoveResponse {
    return axios.delete(`/api_key/${key_id}`);
}

function getObject(type: ObjectType, id: number): GetObjectResponse {
    return axios.get(`/${type}/${id}`);
}

function getObjectList(type: ObjectType, older_than: string, query: string) {
    return axios.get(`/${type}`, {
        params: { older_than, query },
    });
}

function getObjectCount(type: any, query: string) {
    return axios.get(`/${type}/count`, {
        params: { query },
    });
}

function getTags(query: string) {
    return axios.get(`/tag`, {
        params: { query },
    });
}

function getShareInfo() {
    return axios.get("/share");
}

function getObjectTags(id: number) {
    return axios.get(`/object/${id}/tag`);
}

function getObjectComments(id: number) {
    return axios.get(`/object/${id}/comment`);
}

function getObjectRelations(id: number) {
    return axios.get(`/object/${id}/relations`);
}

function addObjectRelation(parent: string, child: string) {
    return axios.put(`/object/${parent}/child/${child}`);
}

function removeObjectRelation(parent: string, child: string) {
    return axios.delete(`/object/${parent}/child/${child}`);
}

function getObjectShares(id: number) {
    return axios.get(`/object/${id}/share`);
}

function getObjectAttributes(id: number) {
    return axios.get(`/object/${id}/attribute`);
}

function removeObject(id: number) {
    return axios.delete(`/object/${id}`);
}

function addObjectTag(id: number, tag: string) {
    return axios.put(`/object/${id}/tag`, { tag });
}

function removeObjectTag(id: string, tag: string) {
    return axios.delete(`/object/${id}/tag`, {
        params: { tag },
    });
}

function addObjectComment(id: number, comment: string) {
    return axios.post(`/object/${id}/comment`, { comment });
}

function removeObjectComment(id: number, comment_id: number) {
    return axios.delete(`/object/${id}/comment/${comment_id}`);
}

function addObjectAttribute(object_id: number, key: string, value: string) {
    return axios.post(`/object/${object_id}/attribute`, { key, value });
}

function removeObjectAttribute(object_id: number, attribute_id: number) {
    return axios.delete(`/object/${object_id}/attribute/${attribute_id}`);
}

function addObjectFavorite(id: number) {
    return axios.put(`/object/${id}/favorite`);
}

function removeObjectFavorite(id: number) {
    return axios.delete(`/object/${id}/favorite`);
}

function shareObjectWith(id: number, group: string) {
    return axios.put(`/object/${id}/share`, { group });
}

function search(query: string) {
    return axios.post(`/search`, { query });
}

function addQuickQuery(type: string, name: string, query: string) {
    return axios.post(`/${type}/quick_query`, { type, name, query });
}

function getQuickQueries(type: any) {
    return axios.get(`/${type}/quick_query`);
}

function deleteQuickQuery(id: number) {
    return axios.delete(`/quick_query/${id}`);
}

function getGroups() {
    return axios.get("/group");
}

function getGroup(name: string) {
    return axios.get(`/group/${name}`);
}

function registerGroup(name: string) {
    return axios.post(`/group/${name}`, { name });
}

function updateGroup(name: string, value: string) {
    return axios.put(`/group/${name}`, value);
}

function removeGroup(name: string) {
    return axios.delete(`/group/${name}`);
}

function addGroupMember(name: string, member: string) {
    return axios.post(`/group/${name}/member/${member}`);
}

function removeGroupMember(name: string, member: string) {
    return axios.delete(`/group/${name}/member/${member}`);
}

function setGroupAdmin(name: string, member: string, group_admin: any) {
    return axios.put(`/group/${name}/member/${member}`, { group_admin });
}

function getUsers() {
    return axios.get("/user", { timeout: undefined });
}

function getPendingUsers() {
    return axios.get("/user", {
        timeout: undefined,
        params: { pending: 1 },
    });
}

function acceptPendingUser(login: string) {
    return axios.post(`/user/${login}/pending`);
}

function rejectPendingUser(login: string, send_email: string) {
    return axios.delete(`/user/${login}/pending`, { params: { send_email } });
}

function getUser(login: string) {
    return axios.get(`/user/${login}`);
}

function getUserProfile(login: string) {
    return axios.get(`/profile/${login}`);
}

function generateApiToken(login: string, expiration: number) {
    expiration = expiration || 3600 * 24 * 365 * 10;
    return axios.post(`/user/${login}/api_token`, { expiration });
}

function generateSetPasswordToken(login: string) {
    return axios.get(`/user/${login}/change_password`);
}

function userRequestPasswordChange(login: string) {
    return axios.post(`/user/${login}/request_password_change`);
}

function setUserDisabled(login: string, disabled: boolean) {
    return axios.put(`/user/${login}`, { disabled });
}

function createUser(
    login: string,
    email: string,
    additional_info: string,
    feed_quality: string,
    send_email: string
) {
    return axios.post(`/user/${login}`, {
        login,
        email,
        additional_info,
        feed_quality,
        send_email,
    });
}

function registerUser(
    login: string,
    email: string,
    additional_info: string,
    recaptcha: string
) {
    return axios.post(`/auth/register`, {
        login,
        email,
        additional_info,
        recaptcha,
    });
}

function updateUser(
    login: string,
    { email, additionalInfo, feedQuality }: any
) {
    return axios.put(`/user/${login}`, {
        email,
        additional_info: additionalInfo,
        feed_quality: feedQuality,
    });
}

function removeUser(login: string) {
    return axios.delete(`/user/${login}`);
}

function getAttributeDefinitions(access: string) {
    return axios.get("/attribute", {
        params: { access },
    });
}

function getAttributeDefinition(key: string) {
    return axios.get(`/attribute/${key}`);
}

function addAttributeDefinition(
    key: string,
    label: string,
    description: string,
    hidden: boolean
) {
    return axios.post("/attribute", {
        key,
        label,
        description,
        hidden,
    });
}

function updateAttributeDefinition({
    key,
    label,
    description,
    url_template,
    rich_template,
    example_value,
    hidden,
}: UpdateAttributeDefinitionParams) {
    return axios.put(`/attribute/${key}`, {
        label,
        description,
        url_template,
        rich_template,
        example_value,
        hidden,
    });
}

function removeAttributeDefinition(key: string) {
    return axios.delete(`/attribute/${key}`);
}

function getAttributePermissions(key: string) {
    return axios.get(`/attribute/${key}/permissions`);
}

function setAttributePermission(
    key: string,
    group_name: string,
    can_read: string,
    can_set: string
) {
    return axios.put(`/attribute/${key}/permissions`, {
        group_name,
        can_read,
        can_set,
    });
}

function removeAttributePermission(key: string, group_name: string) {
    return axios.delete(`/attribute/${key}/permissions`, {
        params: { group_name },
    });
}

function downloadFile(id: number, obfuscate: number = 0) {
    return axios.get(`/file/${id}/download?obfuscate=${obfuscate}`, {
        responseType: "arraybuffer",
        responseEncoding: "binary",
    });
}

async function requestFileDownloadLink(id: number) {
    const response = await axios.post(`/file/${id}/download`);
    const baseURL = getApiForEnvironment();
    return `${baseURL}/file/${id}/download?token=${response.data.token}`;
}

async function requestZipFileDownloadLink(id: number) {
    const response = await axios.post(`/file/${id}/download/zip`);
    const baseURL = getApiForEnvironment();
    return `${baseURL}/file/${id}/download/zip?token=${response.data.token}`;
}

function uploadFile(
    file: File,
    parent: string,
    upload_as: string,
    attributes: any[],
    fileUploadTimeout: number
) {
    let formData = new FormData();
    formData.append("file", file);
    formData.append(
        "options",
        JSON.stringify({
            parent: parent || null,
            upload_as: upload_as,
            attributes: attributes,
        })
    );
    return axios.post(`/file`, formData, { timeout: fileUploadTimeout });
}

function getRemoteNames() {
    return axios.get("/remote");
}

function pushObjectRemote(
    remote: string,
    type: any,
    identifier: string,
    upload_as: string
) {
    return axios.post(`/remote/${remote}/push/${type}/${identifier}`, {
        upload_as: upload_as,
    });
}

function pullObjectRemote(
    remote: string,
    type: any,
    identifier: string,
    upload_as: string
) {
    return axios.post(`/remote/${remote}/pull/${type}/${identifier}`, {
        upload_as: upload_as,
    });
}

function getObjectRemote(remote: string, identifier: string) {
    return axios.get(`/remote/${remote}/api/object/${identifier}`);
}

function getConfigStats(fromTime: number | string) {
    return axios.get("/config/stats", {
        params: {
            range: fromTime,
        },
    });
}

function getRemoteObject(remote: string, type: any, id: number) {
    return axios.get(`/remote/${remote}/api/${type}/${id}`);
}

function getRemoteObjectList(
    remote: string,
    type: any,
    older_than: string,
    query: string
) {
    return axios.get(`/remote/${remote}/api/${type}`, {
        params: { older_than, query },
    });
}

function getRemoteObjectCount(remote: string, type: string, query: string) {
    return axios.get(`/remote/${remote}/api/${type}/count`, {
        params: { query },
    });
}

function getRemoteObjectTags(remote: string, id: number) {
    return axios.get(`/remote/${remote}/api/object/${id}/tag`);
}

function getRemoteObjectComments(remote: string, id: number) {
    return axios.get(`/remote/${remote}/api/object/${id}/comment`);
}

function getRemoteObjectRelations(remote: string, id: number) {
    return axios.get(`/remote/${remote}/api/object/${id}/relations`);
}

function getRemoteObjectShares(remote: string, id: number) {
    return axios.get(`/remote/${remote}/api/object/${id}/share`);
}

function getRemoteObjectAttributes(remote: string, id: number) {
    return axios.get(`/remote/${remote}/api/object/${id}/attribute`);
}

function downloadRemoteFile(remote: string, id: number) {
    return axios.get(`/remote/${remote}/api/file/${id}/download`, {
        responseType: "arraybuffer",
        responseEncoding: "binary",
    });
}

async function requestRemoteFileDownloadLink(remote: string, id: number) {
    const response = await axios.post(
        `/remote/${remote}/api/file/${id}/download`
    );
    const baseURL = getApiForEnvironment();
    return `${baseURL}/remote/${remote}/api/file/${id}/download?token=${response.data.token}`;
}

async function requestRemoteZipFileDownloadLink(remote: string, id: number) {
    const response = await axios.post(
        `/remote/${remote}/api/file/${id}/download/zip`
    );
    const baseURL = getApiForEnvironment();
    return `${baseURL}/remote/${remote}/api/file/${id}/download/zip?token=${response.data.token}`;
}

function getKartonAnalysesList(id: number) {
    return axios.get(`/object/${id}/karton`);
}

function getKartonAnalysisStatus(id: number, analysis_id: number) {
    return axios.get(`/object/${id}/karton/${analysis_id}`);
}

function resubmitKartonAnalysis(id: number) {
    return axios.post(`/object/${id}/karton`);
}

function removeKartonAnalysisFromObject(id: number, analysis_id: number) {
    return axios.delete(`/object/${id}/karton/${analysis_id}`);
}

export const api = {
    axios,
    getApiForEnvironment,
    getServerDocs,
    getServerInfo,
    getServerAdminInfo,
    authLogin,
    authGroups,
    oauthAuthenticate,
    oauthCallback,
    oauthRegisterProvider,
    oauthGetProviders,
    oauthGetSingleProvider,
    oauthUpdateSingleProvider,
    oauthRemoveSingleProvider,
    oauthGetIdentities,
    oauthGetLogoutLink,
    authRefresh,
    authSetPassword,
    authRequestPasswordChange,
    authRecoverPassword,
    apiKeyAdd,
    apiKeyRemove,
    getObject,
    getObjectList,
    getObjectCount,
    getTags,
    getShareInfo,
    getObjectTags,
    getObjectComments,
    getObjectShares,
    removeObject,
    addObjectTag,
    removeObjectTag,
    addObjectComment,
    removeObjectComment,
    addObjectFavorite,
    removeObjectFavorite,
    shareObjectWith,
    search,
    getQuickQueries,
    addQuickQuery,
    deleteQuickQuery,
    getGroups,
    getGroup,
    registerGroup,
    updateGroup,
    removeGroup,
    addGroupMember,
    removeGroupMember,
    setGroupAdmin,
    getPendingUsers,
    acceptPendingUser,
    rejectPendingUser,
    getUsers,
    getUser,
    getUserProfile,
    generateApiToken,
    generateSetPasswordToken,
    userRequestPasswordChange,
    setUserDisabled,
    createUser,
    registerUser,
    updateUser,
    removeUser,
    getObjectAttributes,
    addObjectAttribute,
    removeObjectAttribute,
    getAttributeDefinitions,
    getAttributeDefinition,
    addAttributeDefinition,
    updateAttributeDefinition,
    removeAttributeDefinition,
    getAttributePermissions,
    setAttributePermission,
    removeAttributePermission,
    downloadFile,
    requestFileDownloadLink,
    requestZipFileDownloadLink,
    uploadFile,
    getRemoteNames,
    pushObjectRemote,
    pullObjectRemote,
    getObjectRemote,
    getConfigStats,
    getObjectRelations,
    addObjectRelation,
    removeObjectRelation,
    getRemoteObject,
    getRemoteObjectList,
    getRemoteObjectCount,
    getRemoteObjectTags,
    getRemoteObjectComments,
    getRemoteObjectRelations,
    getRemoteObjectShares,
    getRemoteObjectAttributes,
    downloadRemoteFile,
    requestRemoteFileDownloadLink,
    requestRemoteZipFileDownloadLink,
    getKartonAnalysesList,
    getKartonAnalysisStatus,
    resubmitKartonAnalysis,
    removeKartonAnalysisFromObject,
};

export const APIContext = React.createContext({});
export function APIProvider(props: any) {
    return (
        <APIContext.Provider value={api}>{props.children}</APIContext.Provider>
    );
}
