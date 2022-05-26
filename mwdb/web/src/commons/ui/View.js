import React, { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom-v5-compat";
import { Alert, getErrorMessage } from "./ErrorBoundary";
import { Extendable } from "../extensions";

function ViewAlert({ success, error, warning }) {
    const locationState = useLocation().state || {};
    return (
        <Alert
            success={success || locationState.success}
            error={error || locationState.error}
            warning={warning || locationState.warning}
        />
    );
}

export function useViewAlert() {
    const navigate = useNavigate();
    const location = useLocation();

    const setAlert = useCallback(
        ({ success, error: rawError, warning, state }) => {
            const { pathname, search } = location;
            const error = rawError && getErrorMessage(rawError);
            navigate(
                { pathname, search },
                {
                    state: {
                        ...location.state,
                        ...(state || {}),
                        success,
                        error,
                        warning,
                    },
                    replace: true,
                }
            );
        },
        [location]
    );

    const redirectToAlert = useCallback(
        ({ success, error: rawError, warning, target, state }) => {
            const error = rawError && getErrorMessage(rawError);
            navigate(target, {
                state: {
                    ...(state || {}),
                    success,
                    error,
                    warning,
                },
            });
        },
        [location]
    );

    return useMemo(
        () => ({ setAlert, redirectToAlert }),
        [setAlert, redirectToAlert]
    );
}

export default function View({
    ident,
    children,
    fluid,
    style,
    error,
    success,
    warning,
    showIf = true,
}) {
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
    const viewLayout = ident ? (
        <Extendable ident={ident}>{children}</Extendable>
    ) : (
        children
    );
    // If condition is undefined => assume default true
    return (
        <div className={fluid ? "container-fluid" : "container"} style={style}>
            <ViewAlert error={error} success={success} warning={warning} />
            {showIf ? viewLayout : []}
        </div>
    );
}
