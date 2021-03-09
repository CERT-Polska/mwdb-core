import React from "react";
import ShowConfig from "../ShowConfig";
import RemoteAPI from "./RemoteAPI";

export default function RemoteShowConfig(props) {
    return (
        <RemoteAPI>
            <ShowConfig {...props} />
        </RemoteAPI>
    );
}
