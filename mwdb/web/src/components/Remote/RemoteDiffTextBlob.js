import React from "react";
import DiffTextBlob from "../DiffTextBlob";
import RemoteAPI from "./RemoteAPI";

export default function RemoteDiffTextBlob(props) {
    return (
        <RemoteAPI>
            <DiffTextBlob {...props} />
        </RemoteAPI>
    );
}
