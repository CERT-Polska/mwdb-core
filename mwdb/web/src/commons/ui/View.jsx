import React, { useCallback, useMemo, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getErrorMessage } from "./ErrorBoundary";
import { Extendable } from "../plugins";

export function useViewAlert() {
    const navigate = useNavigate();
    const location = useLocation();
    const [testSuccess, setTestSuccess] = useState("");

    useEffect(() => {
        if (testSuccess) {
            toast(testSuccess, { type: "success" });
        }
    }, [testSuccess]);

    // useEffect(() => {
    //     if (location.state?.error) {
    //         toast(getErrorMessage(location.state.error), { type: "error" });
    //     }
    // }, [location.state?.error]);

    // useEffect(() => {
    //     if (location.state?.warning) {
    //         toast(location.state.warning, { type: "warning" });
    //     }
    // }, [location.state?.warning]);

    // useEffect(() => {
    //     if (location.state?.success) {
    //         console.log(location.state.success);
    //         toast(location.state.success, { type: "success" });
    //     }
    // }, [location.state?.success]);

    const setAlert = useCallback(
        ({ success, error: rawError, warning, state }) => {
            const { pathname, search } = location;
            const error = rawError && getErrorMessage(rawError);

            if (success) {
                setTestSuccess(success);
            }

            navigate(
                { pathname, search },
                {
                    state: {
                        ...location.state,
                        ...(state || {}),
                        // success,
                        // error,
                        // warning,
                    },
                    replace: true,
                }
            );
        },
        [location, navigate]
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
        [navigate]
    );

    return useMemo(
        () => ({ setAlert, redirectToAlert }),
        [setAlert, redirectToAlert]
    );
}

export default function View({ ident, children, fluid, style, showIf = true }) {
    /**
     * View component for all main views. Views shouldn't be nested.
     * Properties spec:
     *
     * ident - identifier that makes View Extendable by plugins
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
            {showIf ? viewLayout : []}
        </div>
    );
}
