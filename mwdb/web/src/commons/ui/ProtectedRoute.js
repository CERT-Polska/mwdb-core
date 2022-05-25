import React, { useContext } from "react";
import { useLocation, Navigate, Route } from "react-router-dom-v5-compat";

import { AuthContext } from "../auth";

export function ConditionalRoute({ children, element, condition, fallback, ...props }) {
    /**
     * Conditional route that fallbacks to another element if condition is not fulfilled
     */
    return (
        <Route {...props} element={condition ? element : fallback}>
            {children}
        </Route>
    );
}

export function ProtectedRoute({ children, element, condition, ...props }) {
    /**
     * Route that requires user to be authenticated and optionally to have
     * additional permission. If user is not authenticated, it's redirected to the
     * login page. If it is authenticated but doesn't fulfill the provided condition,
     * it's redirected to root page with an error
     */
    const auth = useContext(AuthContext);
    const location = useLocation();
    return (
        <ConditionalRoute
            {...props}
            condition={auth.isAuthenticated}
            fallback={
                <Navigate
                    to="/login"
                    state={{
                        prevLocation: location,
                        error: "You need to authenticate before accessing this page",
                    }}
                />
            }
            element={
                condition || condition === undefined ? (
                    element
                ) : (
                    <Navigate
                        to="/"
                        state={{
                            error: `You don't have permission to access '${location.pathname}'`
                        }}
                    />
                )
            }
        >
            {children}
        </ConditionalRoute>
    );
}

export function AdministrativeRoute({children, ...props}) {
    const auth = useContext(AuthContext);
    return <ProtectedRoute condition={auth.isAdmin} {...props}>{children}</ProtectedRoute>;
}
