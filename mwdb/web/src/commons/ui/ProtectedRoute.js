import React, { useContext } from "react";
import { Route } from "react-router-dom";

import { Alert } from "./ErrorBoundary";

import { AuthContext } from "../auth";

export default function ProtectedRoute(props) {
    const auth = useContext(AuthContext);
    function routeRender(renderProps) {
        if (!auth.isAuthenticated) {
            auth.logout("You need to authenticate before accessing this page");
            return [];
        }
        return props.condition ? (
            <props.component {...renderProps} />
        ) : (
            <div className="container-fluid">
                <Alert error="You don't have permission to see that page" />
            </div>
        );
    }
    return <Route {...props} component={undefined} render={routeRender} />;
}
