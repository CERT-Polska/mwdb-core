import React, { Component, useState } from "react";
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

function CriticalError(props) {
    const [show, setShow] = useState(false);

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
                <p style={{ fontWeight: 700 }}>{props.error.message}</p>
                <button
                    className="btn btn-danger"
                    onClick={() => setShow(!show)}
                >
                    {`${show ? "Hide" : "Show"} details`}
                </button>
                {show && (
                    <pre style={{ color: "red", marginTop: 20 }}>
                        {props.error.stack}
                    </pre>
                )}
            </div>
        </div>
    );
}

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
        if (this.state.renderError) {
            return <CriticalError error={this.state.renderError} />;
        }

        if (this.state.propsError) {
            // Fallback to single Alert
            return (
                <div className="container-fluid">
                    <div className="alert alert-danger">
                        {this.state.propsError}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
