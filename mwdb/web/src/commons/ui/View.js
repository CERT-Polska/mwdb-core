import React from "react";
import { useLocation } from "react-router-dom";
import { Alert } from "./ErrorBoundary";
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
