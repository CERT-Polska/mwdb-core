import React from "react";
import { APIContext } from "@mwdb-web/commons/api/context";
import api from "@mwdb-web/commons/api";
import { useRemote } from "@mwdb-web/commons/remotes";

export default function RemoteAPI(props) {
    const remote = useRemote();
    return (
        <APIContext.Provider
            value={{
                ...api,
                remote: remote,
                getObjectCount: (type, older_than, query) =>
                    api.getRemoteObjectCount(remote, type, older_than, query),
                getObjectList: (type, older_than, query) =>
                    api.getRemoteObjectList(remote, type, older_than, query),
                getObject: (type, id) => api.getRemoteObject(remote, type, id),
                getObjectTags: (id) => api.getRemoteObjectTags(remote, id),
                getObjectComments: (id) =>
                    api.getRemoteObjectComments(remote, id),
                getObjectRelations: (id) =>
                    api.getRemoteObjectRelations(remote, id),
                getObjectShares: (id) => api.getRemoteObjectShares(remote, id),
                getObjectMetakeys: (id) =>
                    api.getRemoteObjectMetakeys(remote, id),
                downloadFile: (id) => api.downloadRemoteFile(remote, id),
                requestFileDownloadLink: (id) =>
                    api.requestRemoteFileDownloadLink(remote, id),
            }}
        >
            {props.children}
        </APIContext.Provider>
    );
}
