import React from "react";
import Search from "../Search";
import RemoteAPI from "./RemoteAPI";

export default function RemoteRecentConfigs(props) {
    return (
        <RemoteAPI>
            <Search {...props} />
        </RemoteAPI>
    );
}
