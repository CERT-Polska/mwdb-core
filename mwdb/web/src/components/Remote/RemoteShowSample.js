import React from "react";
import ShowSample from "../ShowSample";
import RemoteShowObject from "./RemoteShowObject";

export default function RemoteShowSample(props) {
    return (
        <RemoteShowObject>
            <ShowSample {...props} />
        </RemoteShowObject>
    );
}
