import React from "react";
import RecentConfigs from "../RecentConfigs";
import RemoteAPI from "./RemoteAPI";

export default function RemoteRecentConfigs(props) {
    return (
        <RemoteAPI>
            <RecentConfigs {...props} />
        </RemoteAPI>
    );
}
