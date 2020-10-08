import Axios from 'axios';

function getApiForEnvironment()
{
    if(process.env.NODE_ENV === 'development')
    {
        // If application is running under development server (out of Docker)
        return process.env.REACT_APP_API_URL || "http://localhost:8080/"
    }
    // Default API endpoint
    return "/api/"
}


let axios = Axios.create({
    baseURL: getApiForEnvironment(),
    timeout: 8000,
    transformResponse: [
        function(data, headers) {
            /**
             * Axios is trying to transform all responses to JSON by default
             * Fortunately we can override this behavior, checking Content-Type first
             */
            if (typeof data === 'string' &&
                headers["content-type"] !== "application/octet-stream") {
                try {
                    data = JSON.parse(data);
                } catch (e) { 
                    /* ignore */ 
                }
            }
            return data;
        }
    ]
});

function getServerDocs() {
    return axios.get('/docs');
}

function getServerInfo() {
    return axios.get("/server");
}

function authLogin(login, password) {
    return axios.post("/auth/login", { login, password })
}

function authRefresh() {
    return axios.post("/auth/refresh")
}

function authSetPassword(token, password) {
    return axios.post(`/auth/change_password`, { token, password })
}

function authRequestPasswordChange() {
    return axios.post(`/auth/request_password_change`)
}

function authRecoverPassword(login, email, recaptcha) {
    return axios.post("/auth/recover_password", {login, email, recaptcha})
}

function apiKeyGetToken(key_id) {
    return axios.get(`/api_key/${key_id}`)
}

function apiKeyAdd(login) {
    return axios.post(`/user/${login}/api_key`)
}

function apiKeyRemove(key_id) {
    return axios.delete(`/api_key/${key_id}`)
}

function getObject(type, id) {
    return axios.get(`/${type}/${id}`)
}

function getObjectList(type, older_than, query) {
    return axios.get(`/${type}`, {
        params: { older_than, query }
    })
}

function getTags(query) {
    return axios.get(`/tag`, {
        params: {query}
    })   
}

function getShareInfo() {
    return axios.get("/share")
}

function getObjectTags(id) {
    return axios.get(`/object/${id}/tag`)
}

function getObjectComments(id) {
    return axios.get(`/object/${id}/comment`)
}

function getObjectRelations(id) {
    return axios.get(`/object/${id}/relations`)
}

function addObjectRelation(parent, child) {
    return axios.put(`/object/${parent}/child/${child}`)
}

function getObjectShares(id) {
    return axios.get(`/object/${id}/share`)
}

function getObjectMetakeys(id) {
    return axios.get(`/object/${id}/meta`)
}

function removeObject(id){
    return axios.delete(`/object/${id}`)
}

function addObjectTag(id, tag) {
    return axios.put(`/object/${id}/tag`, {tag})
}

function removeObjectTag(id, tag) {
    return axios.delete(`/object/${id}/tag`, {
        params: { tag }
    })
}

function addObjectComment(id, comment) {
    return axios.post(`/object/${id}/comment`, {comment})           
}

function removeObjectComment(id, comment_id) {
    return axios.delete(`/object/${id}/comment/${comment_id}`)
}

function addObjectMetakey(id, key, value) {
    return axios.post(`/object/${id}/meta`, {key, value})
}

function removeObjectMetakey(type, id, key, value) {
    return axios.delete(`/${type}/${id}/meta`, {
        params: { key: key, value: value }
    })
}

function shareObjectWith(id, group) {
    return axios.put(`/object/${id}/share`, {group})
}

function search(query) {
    return axios.post(`/search`, {query})
}

function addQuickQuery(type, name, query) {
    return axios.post(`/${type}/quick_query`, {type, name, query})
}

function getQuickQueries(type) {
    return axios.get(`/${type}/quick_query`)
}

function deleteQuickQuery(id) {
    return axios.delete(`/quick_query/${id}`)
}

function getGroups() {
    return axios.get("/group")
}

function getGroup(name) {
    return axios.get(`/group/${name}`)
}

function registerGroup(name) {
    return axios.post(`/group/${name}`, {name})
}

function updateGroup(name, newName, capabilities) {
    return axios.put(`/group/${name}`, { name: newName, capabilities })
}

function addGroupMember(name, member) {
    return axios.put(`/group/${name}/member/${member}`)
}

function removeGroupMember(name, member) {
    return axios.delete(`/group/${name}/member/${member}`)
}

function getUsers() {
    return axios.get("/user", {timeout: null})
}

function getPendingUsers() {
    return axios.get("/user", {
        timeout: null,
        params: {pending: 1}
    })
}

function acceptPendingUser(login) {
    return axios.post(`/user/${login}/pending`)
}

function rejectPendingUser(login, notification) {
    return axios.delete(`/user/${login}/pending`, {params: {notification: notification}})
}

function getUser(login) {
    return axios.get(`/user/${login}`)
}

function getUserProfile(login) {
    return axios.get(`/profile/${login}`)
}

function generateApiToken(login, expiration) {
    expiration = expiration || (3600 * 24 * 365 * 10)
    return axios.post(`/user/${login}/api_token`, { expiration })
}

function generateSetPasswordToken(login) {
    return axios.get(`/user/${login}/change_password`)
}

function setUserDisabled(login, disabled) {
    return axios.put(`/user/${login}`, { disabled })
}

function createUser(login, email, additional_info, feed_quality, send_email) {
    return axios.post(`/user/${login}`, { login, email, additional_info, feed_quality, send_email })
}

function registerUser(login, email, additional_info, recaptcha) {
    return axios.post(`/auth/register`, { login, email, additional_info, recaptcha })
}

function updateUser(login, email, additional_info, feed_quality) {
    return axios.put(`/user/${login}`, { email, additional_info, feed_quality })
}

function getReadableMetakeyDefinitions()
{
    return axios.get("/meta/list/read")
}

function getSettableMetakeyDefinitions()
{
    return axios.get("/meta/list/set")
}

function getMetakeyDefinitions() {
    return axios.get(`/meta/manage`)
}

function getMetakeyDefinition(key) {
    return axios.get(`/meta/manage/${key}`)
}

function addMetakeyDefinition(key, label, description, template, hidden) {
    return axios.put(`/meta/manage/${key}`, {key, label, description, template, hidden})
}

function setMetakeyPermission(key, group_name, can_read, can_set) {
    return axios.put(`/meta/manage/${key}/permissions/${group_name}`, {group_name, can_read, can_set})
}

function deleteMetakeyPermission(key, group_name) {
    return axios.delete(`/meta/manage/${key}/permissions/${group_name}`)
}

function requestFileDownload(id) {
    return axios.post(`/request/sample/${id}`)
}

function uploadFile(file, parent, upload_as, metakeys) {
    let formData = new FormData()
    formData.append('file', file)
    formData.append('options', JSON.stringify({
        'parent': parent || null,
        'upload_as': upload_as,
        'metakeys': metakeys
    }))
    return axios.post(`/file`, formData, {"timeout": 60*1000})
}

function getConfigStats(fromTime) {
    return axios.get("/config/stats", {
        params: {
            "range": fromTime
        }
    })
}

export default {
    axios,
    getApiForEnvironment,
    getServerDocs,
    getServerInfo,
    authLogin,
    authRefresh,
    authSetPassword,
    authRequestPasswordChange,
    authRecoverPassword,
    apiKeyGetToken,
    apiKeyAdd,
    apiKeyRemove,
    getObject,
    getObjectList,
    getTags,
    getShareInfo,
    getObjectTags,
    getObjectComments,
    getObjectShares,
    getObjectMetakeys,
    removeObject,
    addObjectTag,
    removeObjectTag,
    addObjectComment,
    removeObjectComment,
    addObjectMetakey,
    removeObjectMetakey,
    shareObjectWith,
    search,
    getQuickQueries,
    addQuickQuery,
    deleteQuickQuery,
    getGroups,
    getGroup,
    registerGroup,
    updateGroup,
    addGroupMember,
    removeGroupMember,
    getPendingUsers,
    acceptPendingUser,
    rejectPendingUser,
    getUsers,
    getUser,
    getUserProfile,
    generateApiToken,
    generateSetPasswordToken,
    setUserDisabled,
    createUser,
    registerUser,
    updateUser,
    getReadableMetakeyDefinitions,
    getSettableMetakeyDefinitions,
    getMetakeyDefinitions,
    getMetakeyDefinition,
    addMetakeyDefinition,
    setMetakeyPermission,
    deleteMetakeyPermission,
    requestFileDownload,
    uploadFile,
    getConfigStats,
    getObjectRelations,
    addObjectRelation
};
