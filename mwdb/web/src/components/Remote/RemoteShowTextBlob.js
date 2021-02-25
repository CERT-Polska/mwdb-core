import React from "react";
import ShowTextBlob from "../ShowTextBlob";
import RemoteAPI from "./RemoteAPI";

export default function RemoteShowTextBlob(props) {
    return (
        <RemoteAPI>
            <ShowTextBlob {...props} />
        </RemoteAPI>
    );
}
