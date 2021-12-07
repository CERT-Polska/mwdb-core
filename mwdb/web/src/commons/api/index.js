import Axios from "axios";

function getApiForEnvironment() {
    if (process.env.NODE_ENV === "development") {
        // If application is running under development server (out of Docker)
        return (
            process.env.REACT_APP_API_URL.replace(/\/$/g, "") ||
            "http://localhost:8080"
        );
    }
    // Default API endpoint
    return "/api";
}

let axios = Axios.create({
    baseURL: getApiForEnvironment(),
    timeout: 8000,
    transformResponse: [
        function (data, headers) {
            /**
             * Axios is trying to transform all responses to JSON by default
             * Fortunately we can override this behavior, checking Content-Type first
             */
            if (
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

function getServerDocs() {
    return axios.get("/docs");
}

function getServerInfo() {
    return axios.get("/server");
}

function getServerAdminInfo() {
    return axios.get("/server/admin");
}

function authLogin(login, password) {
    return axios.post("/auth/login", { login, password });
}

function authRefresh() {
    return axios.post("/auth/refresh");
}

function authSetPassword(token, password) {
    return axios.post(`/auth/change_password`, { token, password });
}

function authRequestPasswordChange() {
    return axios.post(`/auth/request_password_change`);
}

function authRecoverPassword(login, email, recaptcha) {
    return axios.post("/auth/recover_password", { login, email, recaptcha });
}

function authGroups() {
    return axios.get("/auth/groups");
}

function oauthAuthenticate(provider) {
    return axios.post(`/oauth/${provider}/authenticate`);
}

function oauthCallback(provider, action, code, nonce, state) {
    return axios.post(`/oauth/${provider}/${action}`, {
        code,
        nonce,
        state,
    });
}

function oauthRegisterProvider(
    name,
    client_id,
    client_secret,
    authorization_endpoint,
    token_endpoint,
    userinfo_endpoint,
    jwks_endpoint
) {
    return axios.post(`/oauth`, {
        name,
        client_id,
        client_secret,
        authorization_endpoint,
        token_endpoint,
        userinfo_endpoint,
        jwks_endpoint,
    });
}

function oauthGetProviders() {
    return axios.get("/oauth");
}

function oauthGetSingleProvider(provider_name) {
    return axios.get(`/oauth/${provider_name}`);
}

function oauthUpdateSingleProvider(name, value) {
    return axios.put(`/oauth/${name}`, value);
}

function oauthRemoveSingleProvider(name) {
    return axios.delete(`/oauth/${name}`);
}

function oauthGetIdentities() {
    return axios.get("/oauth/identities");
}

function apiKeyGetToken(key_id) {
    return axios.get(`/api_key/${key_id}`);
}

function apiKeyAdd(login, name) {
    return axios.post(`/user/${login}/api_key`, { name });
}

function apiKeyRemove(key_id) {
    return axios.delete(`/api_key/${key_id}`);
}

function getObject(type, id) {
    return axios.get(`/${type}/${id}`);
}

function getObjectList(type, older_than, query) {
    return axios.get(`/${type}`, {
        params: { older_than, query },
    });
}

function getObjectCount(type, query) {
    return axios.get(`/${type}/count`, {
        params: { query },
    });
}

function getTags(query) {
    return axios.get(`/tag`, {
        params: { query },
    });
}

function getShareInfo() {
    return axios.get("/share");
}

function getObjectTags(id) {
    return axios.get(`/object/${id}/tag`);
}

function getObjectComments(id) {
    return axios.get(`/object/${id}/comment`);
}

function getObjectRelations(id) {
    return axios.get(`/object/${id}/relations`);
}

function addObjectRelation(parent, child) {
    return axios.put(`/object/${parent}/child/${child}`);
}

function removeObjectRelation(parent, child) {
    return axios.delete(`/object/${parent}/child/${child}`);
}

function getObjectShares(id) {
    return axios.get(`/object/${id}/share`);
}

function getObjectAttributes(id) {
    return axios.get(`/object/${id}/attribute`);
}

function removeObject(id) {
    return axios.delete(`/object/${id}`);
}

function addObjectTag(id, tag) {
    return axios.put(`/object/${id}/tag`, { tag });
}

function removeObjectTag(id, tag) {
    return axios.delete(`/object/${id}/tag`, {
        params: { tag },
    });
}

function addObjectComment(id, comment) {
    return axios.post(`/object/${id}/comment`, { comment });
}

function removeObjectComment(id, comment_id) {
    return axios.delete(`/object/${id}/comment/${comment_id}`);
}

function addObjectAttribute(object_id, key, value) {
    return axios.post(`/object/${object_id}/attribute`, { key, value });
}

function removeObjectAttribute(object_id, attribute_id) {
    return axios.delete(`/object/${object_id}/attribute/${attribute_id}`);
}

function addObjectFavorite(id) {
    return axios.put(`/object/${id}/favorite`);
}

function removeObjectFavorite(id) {
    return axios.delete(`/object/${id}/favorite`);
}

function shareObjectWith(id, group) {
    return axios.put(`/object/${id}/share`, { group });
}

function search(query) {
    return axios.post(`/search`, { query });
}

function addQuickQuery(type, name, query) {
    return axios.post(`/${type}/quick_query`, { type, name, query });
}

function getQuickQueries(type) {
    return axios.get(`/${type}/quick_query`);
}

function deleteQuickQuery(id) {
    return axios.delete(`/quick_query/${id}`);
}

function getGroups() {
    return axios.get("/group");
}

function getGroup(name) {
    return axios.get(`/group/${name}`);
}

function registerGroup(name) {
    return axios.post(`/group/${name}`, { name });
}

function updateGroup(name, value) {
    return axios.put(`/group/${name}`, value);
}

function removeGroup(name) {
    return axios.delete(`/group/${name}`);
}

function addGroupMember(name, member) {
    return axios.post(`/group/${name}/member/${member}`);
}

function removeGroupMember(name, member) {
    return axios.delete(`/group/${name}/member/${member}`);
}

function setGroupAdmin(name, member, group_admin) {
    return axios.put(`/group/${name}/member/${member}`, { group_admin });
}

function getUsers() {
    return axios.get("/user", { timeout: null });
}

function getPendingUsers() {
    return axios.get("/user", {
        timeout: null,
        params: { pending: 1 },
    });
}

function acceptPendingUser(login) {
    return axios.post(`/user/${login}/pending`);
}

function rejectPendingUser(login, send_email) {
    return axios.delete(`/user/${login}/pending`, { params: { send_email } });
}

function getUser(login) {
    return axios.get(`/user/${login}`);
}

function getUserProfile(login) {
    return axios.get(`/profile/${login}`);
}

function generateApiToken(login, expiration) {
    expiration = expiration || 3600 * 24 * 365 * 10;
    return axios.post(`/user/${login}/api_token`, { expiration });
}

function generateSetPasswordToken(login) {
    return axios.get(`/user/${login}/change_password`);
}

function userRequestPasswordChange(login) {
    return axios.post(`/user/${login}/request_password_change`);
}

function setUserDisabled(login, disabled) {
    return axios.put(`/user/${login}`, { disabled });
}

function createUser(login, email, additional_info, feed_quality, send_email) {
    return axios.post(`/user/${login}`, {
        login,
        email,
        additional_info,
        feed_quality,
        send_email,
    });
}

function registerUser(login, email, additional_info, recaptcha) {
    return axios.post(`/auth/register`, {
        login,
        email,
        additional_info,
        recaptcha,
    });
}

function updateUser(login, { email, additionalInfo, feedQuality }) {
    return axios.put(`/user/${login}`, {
        email,
        additional_info: additionalInfo,
        feed_quality: feedQuality,
    });
}

function removeUser(login) {
    return axios.delete(`/user/${login}`);
}

function getAttributeDefinitions(access) {
    return axios.get("/attribute", {
        params: { access },
    });
}

function getAttributeDefinition(key) {
    return axios.get(`/attribute/${key}`);
}

function addAttributeDefinition(key, label, description, url_template, hidden) {
    return axios.post("/attribute", {
        key,
        label,
        description,
        url_template,
        hidden,
    });
}

function updateAttributeDefinition(
    key,
    label,
    description,
    url_template,
    hidden
) {
    return axios.put(`/attribute/${key}`, {
        label,
        description,
        url_template,
        hidden,
    });
}

function removeAttributeDefinition(key) {
    return axios.delete(`/attribute/${key}`);
}

function getAttributePermissions(key) {
    return axios.get(`/attribute/${key}/permissions`);
}

function setAttributePermission(key, group_name, can_read, can_set) {
    return axios.put(`/attribute/${key}/permissions`, {
        group_name,
        can_read,
        can_set,
    });
}

function removeAttributePermission(key, group_name) {
    return axios.delete(`/attribute/${key}/permissions`, {
        params: { group_name },
    });
}

function downloadFile(id) {
    return axios.get(`/file/${id}/download`, {
        responseType: "arraybuffer",
        responseEncoding: "binary",
    });
}

async function requestFileDownloadLink(id) {
    const response = await axios.post(`/file/${id}/download`);
    const baseURL = getApiForEnvironment();
    return `${baseURL}/file/${id}/download?token=${response.data.token}`;
}

function uploadFile(file, parent, upload_as, attributes, fileUploadTimeout) {
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

function pushObjectRemote(remote, type, identifier, upload_as) {
    return axios.post(`/remote/${remote}/push/${type}/${identifier}`, {
        upload_as: upload_as,
    });
}

function pullObjectRemote(remote, type, identifier, upload_as) {
    return axios.post(`/remote/${remote}/pull/${type}/${identifier}`, {
        upload_as: upload_as,
    });
}

function getObjectRemote(remote, identifier) {
    return axios.get(`/remote/${remote}/api/object/${identifier}`);
}

function getConfigStats(fromTime) {
    return axios.get("/config/stats", {
        params: {
            range: fromTime,
        },
    });
}

function getRemoteObject(remote, type, id) {
    return axios.get(`/remote/${remote}/api/${type}/${id}`);
}

function getRemoteObjectList(remote, type, older_than, query) {
    return axios.get(`/remote/${remote}/api/${type}`, {
        params: { older_than, query },
    });
}

function getRemoteObjectCount(remote, type, query) {
    return axios.get(`/remote/${remote}/api/${type}/count`, {
        params: { query },
    });
}

function getRemoteObjectTags(remote, id) {
    return axios.get(`/remote/${remote}/api/object/${id}/tag`);
}

function getRemoteObjectComments(remote, id) {
    return axios.get(`/remote/${remote}/api/object/${id}/comment`);
}

function getRemoteObjectRelations(remote, id) {
    return axios.get(`/remote/${remote}/api/object/${id}/relations`);
}

function getRemoteObjectShares(remote, id) {
    return axios.get(`/remote/${remote}/api/object/${id}/share`);
}

function getRemoteObjectAttributes(remote, id) {
    return axios.get(`/remote/${remote}/api/object/${id}/attribute`);
}

function downloadRemoteFile(remote, id) {
    return axios.get(`/remote/${remote}/api/file/${id}/download`, {
        responseType: "arraybuffer",
        responseEncoding: "binary",
    });
}

async function requestRemoteFileDownloadLink(remote, id) {
    const response = await axios.post(
        `/remote/${remote}/api/file/${id}/download`
    );
    const baseURL = getApiForEnvironment();
    return `${baseURL}/remote/${remote}/api/file/${id}/download?token=${response.data.token}`;
}

function getKartonAnalysesList(id) {
    return axios.get(`/object/${id}/karton`);
}

function getKartonAnalysisStatus(id, analysis_id) {
    return axios.get(`/object/${id}/karton/${analysis_id}`);
}

function resubmitKartonAnalysis(id) {
    return axios.post(`/object/${id}/karton`);
}

const api = {
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
    authRefresh,
    authSetPassword,
    authRequestPasswordChange,
    authRecoverPassword,
    apiKeyGetToken,
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
    getKartonAnalysesList,
    getKartonAnalysisStatus,
    resubmitKartonAnalysis,
};
export default api;
