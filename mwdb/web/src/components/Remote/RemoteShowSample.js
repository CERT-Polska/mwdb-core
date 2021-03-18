import React from "react";
import ShowSample from "../ShowSample";
import RemoteAPI from "./RemoteAPI";

export default function RemoteShowSample(props) {
    return (
        <RemoteAPI>
            <ShowSample {...props} />
        </RemoteAPI>
    );
}
