import React from "react";
import ShowTextBlob from "../ShowTextBlob";
import RemoteShowObject from "./RemoteShowObject";

export default function RemoteShowTextBlob(props) {
    return (
        <RemoteShowObject>
            <ShowTextBlob {...props} />
        </RemoteShowObject>
    );
}
