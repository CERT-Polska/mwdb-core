import React, { useCallback, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Alert, getErrorMessage } from "./ErrorBoundary";
import { Extendable } from "../extensions";

function ViewAlert(props) {
    const locationState = useLocation().state || {};
    return (
        <Alert
            success={props.success || locationState.success}
            error={props.error || locationState.error}
            warning={props.warning || locationState.warning}
        />
    );
}

export function useViewAlert() {
    const history = useHistory();

    const setAlert = useCallback(
        ({ success, error: rawError, warning, state }) => {
            const { pathname, search } = history.location;
            const error = rawError && getErrorMessage(rawError);
            history.replace(
                { pathname, search },
                {
                    ...history.location.state,
                    ...(state || {}),
                    success,
                    error,
                    warning,
                }
            );
        },
        [history]
    );

    const redirectToAlert = useCallback(
        ({ success, error: rawError, warning, target, state }) => {
            const error = rawError && getErrorMessage(rawError);
            history.push(target, {
                ...(state || {}),
                success,
                error,
                warning,
            });
        },
        [history]
    );

    return useMemo(
        () => ({ setAlert, redirectToAlert }),
        [setAlert, redirectToAlert]
    );
}

export default function View(props) {
    /**
     * View component for all main views. Views shouldn't be nested.
     * Properties spec:
     *
     * ident - identifier that makes View Extendable by plugins
     * error/success/warning - shows alert with appropriate message
     * location.state.error/success/warning - the same based on location.state
     * showIf - allows to show view conditionally (e.g. if all required data are loaded)
     * fluid - uses wide fluid view instead of default container
     * style - custom container styling
     */
    const children = props.ident ? (
        <Extendable ident={props.ident}>{props.children}</Extendable>
    ) : (
        props.children
    );
    // If condition is undefined => assume default true
    const showIf = props.showIf === undefined || props.showIf;
    return (
        <div
            className={props.fluid ? "container-fluid" : "container"}
            style={props.style}
        >
            <ViewAlert
                error={props.error}
                success={props.success}
                warning={props.warning}
            />
            {showIf ? children : []}
        </div>
    );
}
