import React, { useContext } from "react";
import api from "../api";

import { APIContext } from "./context";

export function APIProvider(props) {
    return (
        <APIContext.Provider value={{
            getObjectTags: api.getObjectTags
        }}>
            {props.children}
        </APIContext.Provider>
    )
}

export function useAPI() {
    return useContext(APIContext);
}