import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { toast } from "react-toastify";

import { useRemote } from "@mwdb-web/commons/remotes";
import { RemoteAPI } from "./RemoteAPI";

export function RemoteViews() {
    const remote = useRemote();
    const message = `Remote view of ${remote}`;

    useEffect(() => {
        const toastId = "toast-remote-view";
        toast(message, {
            toastId: "toast-remote-view",
            position: "bottom-right",
            type: "warning",
            autoClose: false,
            closeButton: false,
            closeOnClick: false,
        });
        return () => {
            toast.dismiss(toastId);
        };
    }, []);

    return (
        <RemoteAPI>
            <Outlet />
        </RemoteAPI>
    );
}
