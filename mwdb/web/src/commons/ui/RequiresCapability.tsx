import React, { useContext } from "react";
import { AuthContext } from "../auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import { Capabality } from "@mwdb-web/types/types";

type Props = {
    children: React.ReactNode;
    capability: Capabality;
};

export function RequiresCapability({ capability, children }: Props) {
    /**
     * Wrapper for views that require additional capability
     */
    const auth = useContext(AuthContext);
    const location = useLocation();
    if (!auth.hasCapability(capability)) {
        toast(`You don't have permission to access '${location.pathname}'`, {
            type: "error",
        });
        return <Navigate to="/" />;
    }
    return children ? children : <Outlet />;
}
