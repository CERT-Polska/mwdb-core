import React, { useContext } from "react";
import api from "../api";

import { APIContext } from "./context";

export function APIProvider(props) {
    return (
        <APIContext.Provider
            value={{
                getObject: api.getObject,
                getObjectList: api.getObjectList,
                getObjectCount: api.getObjectCount,
                getObjectTags: api.getObjectTags,
                getObjectComments: api.getObjectComments,
                getObjectRelations: api.getObjectRelations,
                getObjectShares: api.getObjectShares,
                getObjectMetakeys: api.getObjectMetakeys,
                addObjectFavorite: api.addObjectFavorite,
                removeObjectFavorite: api.removeObjectFavorite,
                search: api.search,
                addQuickQuery: api.addQuickQuery,
                getQuickQueries: api.getQuickQueries,
                deleteQuickQuery: api.deleteQuickQuery,
            }}
        >
            {props.children}
        </APIContext.Provider>
    );
}
