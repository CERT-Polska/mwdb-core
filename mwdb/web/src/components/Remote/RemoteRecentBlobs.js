import React from "react";
import RecentBlobs from "../RecentBlobs";
import RemoteAPI from "./RemoteAPI";

export default function RemoteRecentConfigs(props) {
    return (
        <RemoteAPI>
            <RecentBlobs {...props} />
        </RemoteAPI>
    );
}
