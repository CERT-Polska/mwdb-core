import React from "react";
import { APIContext } from "@mwdb-web/commons/api/context";
import api from "@mwdb-web/commons/api";
import { useRemote } from "@mwdb-web/commons/remotes";
import { Alert } from "@mwdb-web/commons/ui";

export default function RemoteAPI(props) {
    const remote = useRemote();
    const message = `Remote view of ${remote}`;
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
            <div className="container-fluid">
                <Alert warning={message} />
            </div>
            {props.children}
        </APIContext.Provider>
    );
}
