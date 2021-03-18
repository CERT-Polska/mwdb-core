import React, { Component } from "react";
import { intersperse } from "../helpers";

function getErrorMessage(error) {
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
            <div className="alert alert-danger">
                {getErrorMessage(props.error)}
            </div>
        );
    } else if (props.success) {
        return <div className="alert alert-success">{props.success}</div>;
    } else if (props.warning) {
        return <div className="alert alert-warning">{props.warning}</div>;
    }
    return <div />;
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
