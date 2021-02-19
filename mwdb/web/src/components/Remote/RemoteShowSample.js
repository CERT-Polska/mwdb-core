import React from "react";
import ShowSample from "../ShowSample";
import { APIContext } from "@mwdb-web/commons/api/context";
import api from "@mwdb-web/commons/api";

export default function RemoteShowSample(props) {
    return (
        <APIContext.Provider
            value={{
                getObject: (type, id) =>
                    api.getRemoteObjectTags(remote_name, type, id),
                getObjectTags: (id) => api.getRemoteObjectTags(remote_name, id),
                getObjectComments: (id) =>
                    api.getObjectComments(remote_name, id),
                getObjectRelations: (id) =>
                    api.getObjectRelations(remote_name, id),
                getObjectShares: (id) => api.getObjectShares(remote_name, id),
                getObjectMetakeys: (id) =>
                    api.getObjectMetakeys(remote_name, id),
                addObjectFavorite: (id) =>
                    api.addObjectFavorite(remote_name, id),
                removeObjectFavorite: (id) =>
                    api.removeObjectFavorite(remote_name, id),
            }}
        >
            <ShowSample {...props} />
        </APIContext.Provider>
    );
}
