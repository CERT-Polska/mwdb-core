import React, { useContext } from "react";
import { Route } from "react-router-dom";

import ErrorBoundary from "./ErrorBoundary";

import { AuthContext } from "../auth"

export default function ProtectedRoute(props) {
    const auth = useContext(AuthContext);
    function routeRender(renderProps) {
        if(!auth.isAuthenticated)
        {
            auth.logout("You need to authenticate before accessing this page");
            return [];
        }
        return (
            props.condition
            ? <props.component {...renderProps} />
            : <ErrorBoundary error="You don't have permission to see that page" />
        )
    }
    return <Route {...props} 
                  component={undefined}
                  render={routeRender} />
}
