import React from "react";
import { useParams } from "react-router-dom";
import { APIContext } from "@mwdb-web/commons/api/context";
import api from "@mwdb-web/commons/api";

export default function RemoteAPI(props) {
    let { remote } = useParams();
    return (
        <APIContext.Provider
            value={{
                remote: remote,
                getObjectCount: (type, older_than, query) =>
                    api.getRemoteObjectCount(remote, type, older_than, query),
                getObjectList: (type, query) =>
                    api.getRemoteObjectList(remote, type, query),
                getObject: (type, id) => api.getRemoteObject(remote, type, id),
                getObjectTags: (id) => api.getRemoteObjectTags(remote, id),
                getObjectComments: (id) =>
                    api.getRemoteObjectComments(remote, id),
                getObjectRelations: (id) =>
                    api.getRemoteObjectRelations(remote, id),
                getObjectShares: (id) => api.getRemoteObjectShares(remote, id),
                getObjectMetakeys: (id) =>
                    api.getRemoteObjectMetakeys(remote, id),
                requestFileDownload: (id) =>
                    api.requestRemoteFileDownload(remote, id),
                addObjectFavorite: (id) =>
                    api.addRemoteObjectFavorite(remote, id),
                removeObjectFavorite: (id) =>
                    api.removeRemoteObjectFavorite(remote, id),
            }}
        >
            {props.children}
        </APIContext.Provider>
    );
}
