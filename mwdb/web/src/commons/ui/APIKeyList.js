import React, { Component } from "react";
import PagedList from "./PagedList";
import DateString from "./DateString";

export default class APIKeyList extends Component {
    state = {
        activePage: 1,
    };

    handlePageChange = (activePage) => {
        this.setState({ activePage });
    };

    get items() {
        let propagatedProps = {
            previewKey: this.props.previewKey,
            removeKey: this.props.removeKey,
            closeKeyPreview: this.props.closeKeyPreview,
        };
        return this.props.items
            .map((item) => ({
                ...propagatedProps,
                ...item,
                ...(item.id === this.props.showedId
                    ? { token: this.props.token }
                    : {}),
            }))
            .concat({ addKey: this.props.addKey });
    }

    render() {
        return (
            <div>
                <div>
                    <b>Note:</b> UUID is only a key identifier - click "Show API
                    token" to copy/paste authentication token
                </div>
                <PagedList
                    listItem={APIKeyItem}
                    columnNames={["Key UUID", "Issue date", "Actions"]}
                    items={this.items}
                    itemCount={this.items.length}
                    activePage={this.state.activePage}
                    onPageChange={this.handlePageChange}
                    tableStyle={{ overflowX: "visible" }}
                />
            </div>
        );
    }
}

class APIKeyItem extends Component {
    state = {};

    render() {
        if (!this.props.addKey)
            return (
                <React.Fragment>
                    <tr>
                        <td style={{ textAlign: "left" }}>{this.props.id}</td>
                        <td style={{ textAlign: "left" }}>
                            Issued on <DateString date={this.props.issued_on} />{" "}
                            {this.props.issuer_login
                                ? "by " + this.props.issuer_login
                                : ""}
                        </td>
                        <td>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() =>
                                    this.props.previewKey(this.props.id)
                                }
                                disabled={this.props.token}
                            >
                                Show API token
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() =>
                                    this.props.removeKey(this.props.id)
                                }
                            >
                                Remove key
                            </button>
                        </td>
                    </tr>
                    {this.props.token ? (
                        <tr>
                            <td colspan="2">
                                <textarea readOnly className="form-control">
                                    {this.props.token}
                                </textarea>
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => this.props.closeKeyPreview()}
                                >
                                    Close
                                </button>
                            </td>
                        </tr>
                    ) : (
                        []
                    )}
                </React.Fragment>
            );
        else
            return (
                <tr>
                    <td style={{ textAlign: "left" }} colspan="3">
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => this.props.addKey(this.props.id)}
                        >
                            Create a new key
                        </button>
                    </td>
                </tr>
            );
    }
}
