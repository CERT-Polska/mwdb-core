import React from "react";
import { Outlet } from "react-router-dom";
import { useRemote } from "@mwdb-web/commons/remotes";
import { Alert } from "@mwdb-web/commons/ui";

import RemoteAPI from "./RemoteAPI";

export default function RemoteViews() {
    const remote = useRemote();
    const message = `Remote view of ${remote}`;
    return (
        <RemoteAPI>
            <div className="container-fluid">
                <Alert warning={message} />
            </div>
            <Outlet />
        </RemoteAPI>
    );
}
