import React from "react";
import ShowSample from "../ShowSample";
import { APIContext } from "@mwdb-web/commons/api/context";
import api from "@mwdb-web/commons/api";
import { useParams } from "react-router-dom";

export default function RemoteShowSample(props) {
    let { remote } = useParams();
    return (
        <APIContext.Provider
            value={{
                getObject: (type, id) => api.getRemoteObject(remote, type, id),
                getObjectTags: (id) => api.getRemoteObjectTags(remote, id),
                getObjectComments: (id) =>
                    api.getRemoteObjectComments(remote, id),
                getObjectRelations: (id) =>
                    api.getRemoteObjectRelations(remote, id),
                getObjectShares: (id) => api.getRemoteObjectShares(remote, id),
                getObjectMetakeys: (id) =>
                    api.getRemoteObjectMetakeys(remote, id),
                addObjectFavorite: (id) =>
                    api.addRemoteObjectFavorite(remote, id),
                removeObjectFavorite: (id) =>
                    api.removeRemoteObjectFavorite(remote, id),
            }}
        >
            <ShowSample {...props} />
        </APIContext.Provider>
    );
}
