import React from "react";
import { useParams } from "react-router-dom";
import { APIContext } from "@mwdb-web/commons/api/context";
import api from "@mwdb-web/commons/api";
import { Alert } from "../../commons/ui";

export default function RemoteAPI(props) {
    const { remote } = useParams();
    const message = `Remote view of ${remote}`;
    return (
        <APIContext.Provider
            value={{
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
                requestFileDownload: (id) =>
                    api.requestRemoteFileDownload(remote, id),
            }}
        >
            <div className="container-fluid">
                <Alert warning={message} />
            </div>
            {props.children}
        </APIContext.Provider>
    );
}
