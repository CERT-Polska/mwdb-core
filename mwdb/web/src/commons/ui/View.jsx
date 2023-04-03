import React, { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getErrorMessage } from "./ErrorBoundary";
import { Extendable } from "../plugins";

export function useViewAlert() {
    const navigate = useNavigate();
    const location = useLocation();

    const setMessages = useCallback(({ success, error, warning }) => {
        if (success) {
            toast(success, { type: "success" });
        }

        if (error) {
            toast(getErrorMessage(error), { type: "error" });
        }

        if (warning) {
            toast(warning, { type: "warning" });
        }
    }, []);

    const setAlert = useCallback(
        ({ success, error, warning, state }) => {
            const { pathname, search } = location;
            setMessages({ success, error, warning });

            navigate(
                { pathname, search },
                {
                    state: {
                        ...location.state,
                        ...(state || {}),
                    },
                    replace: true,
                }
            );
        },
        [location, navigate]
    );

    const redirectToAlert = useCallback(
        ({ success, error, warning, target, state }) => {
            setMessages({ success, error, warning });

            navigate(target, {
                state: {
                    ...(state || {}),
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
