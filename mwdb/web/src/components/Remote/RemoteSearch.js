import React from "react";
import Search from "../Search";
import RemoteAPI from "./RemoteAPI";

export default function RemoteSearch(props) {
    return (
        <RemoteAPI>
            <Search {...props} />
        </RemoteAPI>
    );
}
