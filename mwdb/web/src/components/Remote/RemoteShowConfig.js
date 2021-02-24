import React from "react";
import ShowConfig from "../ShowConfig";
import RemoteShowObject from "./RemoteShowObject";

export default function RemoteShowConfig(props) {
    return (
        <RemoteShowObject>
            <ShowConfig {...props} />
        </RemoteShowObject>
    );
}
