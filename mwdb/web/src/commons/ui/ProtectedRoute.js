import React, { useContext } from "react";
import { useLocation } from "react-router";
import { Redirect, Route } from "react-router-dom";

import { AuthContext } from "../auth";

export function ConditionalRoute({ children, condition, fallback, ...props }) {
    return <Route {...props}>{condition ? children : fallback}</Route>;
}

export function ProtectedRoute({ children, condition, ...props }) {
    const auth = useContext(AuthContext);
    const location = useLocation();
    return (
        <ConditionalRoute
            condition={auth.isAuthenticated}
            fallback={
                <Redirect
                    to={{
                        pathname: "/login",
                        state: {
                            prevLocation: location,
                            error: "You need to authenticate before accessing this page",
                        },
                    }}
                />
            }
            {...props}
        >
            {condition || condition === undefined ? (
                children
            ) : (
                <Redirect
                    to={{
                        pathname: "/",
                        state: {
                            error: `You don't have permission to access '${location.pathname}'`,
                        },
                    }}
                />
            )}
        </ConditionalRoute>
    );
}

export function AdministrativeRoute(args) {
    const auth = useContext(AuthContext);
    return <ProtectedRoute condition={auth.isAdmin} {...args} />;
}
