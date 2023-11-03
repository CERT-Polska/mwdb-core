import { useMemo } from "react";
import { api, APIContext } from "@mwdb-web/commons/api";
import { useRemote } from "@mwdb-web/commons/remotes";
import { RemoteApiContextValues } from "@mwdb-web/types/context";

type Props = {
    children: JSX.Element;
};

export function RemoteAPI({ children }: Props) {
    const remote = useRemote() ?? "";
    const remoteApi: RemoteApiContextValues = useMemo(
        () => ({
            ...api,
            remote,
            getObjectCount: (type, query) =>
                api.getRemoteObjectCount(remote, type, query),
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
            requestRemoteZipFileDownloadLink: (id) =>
                api.requestZipFileDownloadLink(id),
        }),
        [remote]
    );
    return (
        <APIContext.Provider value={remoteApi}>{children}</APIContext.Provider>
    );
}
