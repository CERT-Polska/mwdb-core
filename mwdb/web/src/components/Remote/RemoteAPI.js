import React, { useMemo } from "react";
import { APIContext } from "@mwdb-web/commons/api/context";
import api from "@mwdb-web/commons/api";
import { useRemote } from "@mwdb-web/commons/remotes";

export default function RemoteAPI({ children }) {
    const remote = useRemote();
    const remoteApi = useMemo(
        () => ({
            ...api,
            remote,
            getObjectCount: (type, older_than, query) =>
                api.getRemoteObjectCount(remote, type, older_than, query),
            getObjectList: (type, older_than, query) =>
                api.getRemoteObjectList(remote, type, older_than, query),
            getObject: (type, id) => api.getRemoteObject(remote, type, id),
            getObjectTags: (id) => api.getRemoteObjectTags(remote, id),
            getObjectComments: (id) => api.getRemoteObjectComments(remote, id),
            getObjectRelations: (id) =>
                api.getRemoteObjectRelations(remote, id),
            getObjectShares: (id) => api.getRemoteObjectShares(remote, id),
            getObjectAttributes: (id) =>
                api.getRemoteObjectAttributes(remote, id),
            downloadFile: (id) => api.downloadRemoteFile(remote, id),
            requestFileDownloadLink: (id) =>
                api.requestRemoteFileDownloadLink(remote, id),
        }),
        [remote]
    );
    return (
        <APIContext.Provider value={remoteApi}>{children}</APIContext.Provider>
    );
}
