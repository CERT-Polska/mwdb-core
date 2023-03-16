import React, { Component, useEffect, useState } from "react";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { intersperse } from "../helpers";

export function getErrorMessage(error) {
    if (error.response) {
        if (error.response.data.message) {
            return error.response.data.message;
        }
        if (error.response.data.errors) {
            let messages = Object.keys(error.response.data.errors).map(
                (key) => {
                    if (key === "_schema")
                        return error.response.data.errors[key];
                    else return `${key}: ${error.response.data.errors[key]}`;
                }
            );
            return intersperse(messages, <br />);
        }
    }
    return error.toString();
}

export function Alert(props) {
    if (props.error) {
        return (
            <AlertMessage
                type={"danger"}
                message={getErrorMessage(props.error)}
            />
        );
    }
    if (props.success) {
        return <AlertMessage type={"success"} message={props.success} />;
    }
    if (props.warning) {
        return <AlertMessage type={"warning"} message={props.warning} />;
    }
    return <></>;
}

function AlertMessage(props) {
    const { type, message } = props;
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setIsVisible(true);
    }, [props]);

    return (
        <>
            {isVisible && (
                <div className={`alert alert-${type} alert-message`}>
                    <span>{message}</span>
                    <span
                        role="button"
                        tabIndex={0}
                        className="alert-message__close"
                        onClick={() => setIsVisible(false)}
                    >
                        <FontAwesomeIcon icon={faClose} />
                    </span>
                </div>
            )}
        </>
    );
}

function CriticalError(props) {
    return (
        <div className="container-fluid">
            <div className="alert alert-danger" role="alert">
                <h4 className="alert-heading">Critical error occurred</h4>
                <p>
                    Something really bad happened during rendering this view. If
                    this is not your fault, let us know by leaving a bug report
                    in{" "}
                    <a href="https://github.com/CERT-Polska/mwdb-core/issues">
                        Issues
                    </a>
                    <br />
                    Remember to copy-paste the error message shown below to the
                    bug report.
                </p>
                <hr />
                <p className="mb-0">{props.error.toString()}</p>
            </div>
        </div>
    );
}

//TODO: rewrite to function component
export default class ErrorBoundary extends Component {
    state = {};

    static getDerivedStateFromProps(props) {
        // Derived state for external critical errors
        return { propsError: props.error };
    }

    static getDerivedStateFromError(error) {
        // Derived state for render() errors
        return { renderError: error };
    }

    render() {
        if (this.state.renderError)
            return <CriticalError error={this.state.renderError} />;
        else if (this.state.propsError) {
            // Fallback to single Alert
            return (
                <div className="container-fluid">
                    <Alert error={this.state.propsError} />
                </div>
            );
        } else return this.props.children;
    }
}
