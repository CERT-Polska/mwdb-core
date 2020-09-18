import React from "react";
import { Route } from "react-router-dom";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import ErrorBoundary from "./ErrorBoundary";

import { authActions } from "../auth";
import history from "../history";

function ProtectedRoute(props) {
    let routeRender = (renderProps) => {
        if(!props.isAuthenticated)
        {
            props.auth.logout({error: "You need to authenticate before accessing this page."}, history.location);
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

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        isAuthenticated: !!state.auth.loggedUser
    }
}

function mapDispatchToProps(dispatch) {
    return {
        auth: bindActionCreators(authActions, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProtectedRoute);
