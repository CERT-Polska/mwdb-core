import React from "react";
import ShowSample from "./ShowSample";
import {APIContext} from "@mwdb-web/commons/api/context";

export default function RemoteShowSample(props) {
    return (
        <APIContext.Provider value={{
            getObjectTags: () => (
                new Promise((resolve) => {
                    resolve({data: [{tag: "tag-from-remote"}]})
                })
            )
        }}>
            <ShowSample {...props}/>
        </APIContext.Provider>
    );
}
