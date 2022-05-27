import React, { useContext } from "react";
import { AuthContext } from "../auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function RequiresAuth({ children }) {
    /**
     * Wrapper for views that require authentication
     */
    const auth = useContext(AuthContext);
    const location = useLocation();
    if (!auth.isAuthenticated)
        return (
            <Navigate
                to="/login"
                state={{
                    prevLocation: location,
                    error: "You need to authenticate before accessing this page",
                }}
            />
        );
    return children ? children : <Outlet />;
}

export function RequiresCapability({ capability, children }) {
    /**
     * Wrapper for views that require additional capability
     */
    const auth = useContext(AuthContext);
    const location = useLocation();
    if (!auth.hasCapability(capability))
        return (
            <Navigate
                to="/"
                state={{
                    error: `You don't have permission to access '${location.pathname}'`,
                }}
            />
        );
    return children ? children : <Outlet />;
}
