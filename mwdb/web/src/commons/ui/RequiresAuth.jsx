import React, { useContext } from "react";
import { AuthContext } from "../auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export function RequiresAuth({ children }) {
    /**
     * Wrapper for views that require authentication
     */
    const auth = useContext(AuthContext);
    const location = useLocation();
    if (!auth.isAuthenticated) {
        toast("You need to authenticate before accessing this page", {
            type: "error",
        });
        return (
            <Navigate
                to="/login"
                state={{
                    prevLocation: location,
                }}
            />
        );
    }
    return children ? children : <Outlet />;
}

export function RequiresCapability({ capability, children }) {
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
