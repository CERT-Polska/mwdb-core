import React from "react";
import RecentSamples from "../RecentSamples";
import RemoteAPI from "./RemoteAPI";

export default function RemoteRecentConfigs(props) {
    return (
        <RemoteAPI>
            <RecentSamples {...props} />
        </RemoteAPI>
    );
}