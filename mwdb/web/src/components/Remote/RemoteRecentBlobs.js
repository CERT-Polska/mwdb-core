import React from "react";
import RecentBlobs from "../RecentBlobs";
import RemoteAPI from "./RemoteAPI";

export default function RemoteRecentBlobs(props) {
    return (
        <RemoteAPI>
            <RecentBlobs {...props} />
        </RemoteAPI>
    );
}
