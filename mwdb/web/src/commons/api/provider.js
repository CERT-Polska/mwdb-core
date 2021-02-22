import React from "react";
import api from "../api";

import { APIContext } from "./context";

export function APIProvider(props) {
    return (
        <APIContext.Provider
            value={{
                ...api,
            }}
        >
            {props.children}
        </APIContext.Provider>
    );
}
