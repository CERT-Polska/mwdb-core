import React, { Component, useCallback, useContext } from "react";
import { withRouter } from "react-router";
import { useDropzone } from "react-dropzone";
import queryString from "query-string";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AttributesAddModal from "./AttributesAddModal";

import api from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { Autocomplete, DataTable, View } from "@mwdb-web/commons/ui";
import { ConfigContext } from "@mwdb-web/commons/config";

function UploadDropzone(props) {
    const onDrop = props.onDrop;
    const { getRootProps, getInputProps, isDragActive, isDragReject } =
        useDropzone({
            multiple: false,
            onDrop: useCallback(
                (acceptedFiles) => onDrop(acceptedFiles[0]),
                [onDrop]
            ),
        });

    const dropzoneClassName = isDragActive
        ? "dropzone-active"
        : isDragReject
        ? "dropzone-reject"
        : "";

    return (
        <div
            {...getRootProps({
                className: `dropzone-ready dropzone ${dropzoneClassName}`,
            })}
        >
            <input {...getInputProps()} />
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">
                        <FontAwesomeIcon icon="upload" size="x" />
                        &nbsp;
                        {props.file ? (
                            <span>
                                {props.file.name} - {props.file.size} bytes
                            </span>
                        ) : (
                            <span>Click here to upload</span>
                        )}
                    </h5>
                </div>
            </div>
        </div>
    );
}

class Upload extends Component {
    state = {
        files: null,
        error: null,
        success: null,
        shareWith: "default",
        group: "",
        groups: null,
        parent: "",
        attributes: [],
        isAttributeModalOpen: false,
    };

    static contextType = AuthContext;

    get parentFromQuery() {
        return queryString.parse(this.props.location.search)["parent"];
    }

    handleParentChange = (ev) => {
        let value = ev.target.value;
        ev.preventDefault();
        this.setState({ parent: value });
    };

    handleParentClear = () => {
        if (this.parentFromQuery) this.props.history.push("upload");
        this.setState({ parent: "" });
    };

    async updateGroups() {
        try {
            let response = await api.getShareInfo();
            let groups = response.data.groups;
            groups.splice(groups.indexOf("public"), 1);
            groups.splice(groups.indexOf(this.context.user.login), 1);
            this.setState({
                groups: groups,
                shareWith: groups.length > 0 ? "default" : "private",
            });
        } catch (error) {
            this.setState({ error });
        }
    }

    componentDidMount() {
        this.updateGroups();
    }

    updateSharingMode = (event) => {
        this.setState({ shareWith: event.target.value, group: "" });
    };

    sharingModeToUploadParam = () => {
        if (this.state.shareWith === "default") return "*";
        if (this.state.shareWith === "public") return "public";
        if (this.state.shareWith === "private") return "private";
        if (this.state.shareWith === "single") return this.state.group;
    };

    getSharingModeHint = () => {
        if (this.state.shareWith === "default")
            return `The sample and all related artifacts will be shared with all your workgroups`;
        if (this.state.shareWith === "public")
            return `The sample will be added to the public feed, so everyone will see it.`;
        else if (this.state.shareWith === "private")
            return `The sample will be accessible only from your account.`;
        else if (this.state.shareWith === "single")
            return `The sample will be accessible only for you and chosen group.`;
    };

    handleSubmit = async () => {
        try {
            let response = await api.uploadFile(
                this.state.file,
                this.parentFromQuery || this.state.parent,
                this.sharingModeToUploadParam(),
                this.state.attributes,
                this.props.fileUploadTimeout
            );
            this.sha256 = response.data.sha256;
            this.props.history.replace("/file/" + this.sha256, {
                success: "File uploaded successfully.",
            });
        } catch (error) {
            this.setState({ error });
        }
    };

    handleAttributeModalOpen = () => {
        this.setState({ isAttributeModalOpen: true });
    };

    onRequestAttributeModalClose = () => {
        this.setState({ isAttributeModalOpen: false });
    };

    onAttributeAdd = (key, value) => {
        for (let attr of this.state.attributes)
            if (attr.key === key && attr.value === value) {
                // that key, value was added yet
                this.onRequestAttributeModalClose();
                return;
            }
        this.setState({
            attributes: [...this.state.attributes, { key, value }],
        });
        this.onRequestAttributeModalClose();
    };

    onAttributeRemove = (idx) => {
        this.setState({
            attributes: [
                ...this.state.attributes.slice(0, idx),
                ...this.state.attributes.slice(idx + 1),
            ],
        });
    };

    render() {
        return (
            <View
                ident="upload"
                error={this.state.error}
                success={this.state.success}
                showIf={this.state.groups !== null}
            >
                <form>
                    <UploadDropzone
                        file={this.state.file}
                        onDrop={(file) => this.setState({ file })}
                    />
                    <div className="form-group">
                        {this.context.hasCapability(
                            Capability.addingParents
                        ) ? (
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <label className="input-group-text">
                                        Parent
                                    </label>
                                </div>
                                <input
                                    className="form-control"
                                    type="text"
                                    style={{ fontSize: "medium" }}
                                    placeholder="(Optional) Type parent identifier..."
                                    value={
                                        this.parentFromQuery ||
                                        this.state.parent
                                    }
                                    onChange={this.handleParentChange}
                                    disabled={!!this.parentFromQuery}
                                />
                                <div className="input-group-append">
                                    <input
                                        className="btn btn-outline-danger"
                                        type="button"
                                        value="Clear"
                                        onClick={this.handleParentClear}
                                    />
                                </div>
                            </div>
                        ) : (
                            []
                        )}
                        <div className="input-group mb-3">
                            <div className="input-group-prepend">
                                <label className="input-group-text">
                                    Share with
                                </label>
                            </div>
                            <select
                                className="custom-select"
                                value={this.state.shareWith}
                                onChange={this.updateSharingMode}
                            >
                                {this.state.groups && this.state.groups.length
                                    ? [
                                          <option value="default">
                                              All my groups
                                          </option>,
                                          <option value="single">
                                              Single group...
                                          </option>,
                                      ]
                                    : []}
                                <option value="public">Everybody</option>
                                <option value="private">Only me</option>
                            </select>
                            <div className="form-hint">
                                {this.getSharingModeHint()}
                            </div>
                        </div>
                        {this.state.shareWith === "single" ? (
                            <div className="mb-3">
                                <Autocomplete
                                    value={this.state.group}
                                    items={this.state.groups.filter(
                                        (item) =>
                                            item
                                                .toLowerCase()
                                                .indexOf(
                                                    this.state.group.toLowerCase()
                                                ) !== -1
                                    )}
                                    onChange={(value) =>
                                        this.setState({ group: value })
                                    }
                                    className="form-control"
                                    style={{ fontSize: "medium" }}
                                    placeholder="Type group name..."
                                    prependChildren
                                >
                                    <div className="input-group-prepend">
                                        <label className="input-group-text">
                                            Group name
                                        </label>
                                    </div>
                                </Autocomplete>
                            </div>
                        ) : (
                            []
                        )}
                        {this.state.attributes.length > 0 ? (
                            <div>
                                <h5>Attributes</h5>
                                <DataTable>
                                    {this.state.attributes.map((attr, idx) => (
                                        <tr key={idx} className="centered">
                                            <th>{attr.key}</th>
                                            <td>
                                                {typeof attr.value ===
                                                "string" ? (
                                                    attr.value
                                                ) : (
                                                    <pre className="attribute-object">
                                                        {"(object)"}{" "}
                                                        {JSON.stringify(
                                                            attr.value,
                                                            null,
                                                            4
                                                        )}
                                                    </pre>
                                                )}
                                            </td>
                                            <td>
                                                <input
                                                    value="Dismiss"
                                                    className="btn btn-danger"
                                                    type="button"
                                                    onClick={() =>
                                                        this.onAttributeRemove(
                                                            idx
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </DataTable>
                            </div>
                        ) : (
                            []
                        )}
                        <input
                            value="Upload File"
                            className="btn btn-success"
                            type="button"
                            onClick={this.handleSubmit}
                            disabled={!this.state.file}
                        />
                        <input
                            value="Add attribute"
                            className="btn btn-success"
                            type="button"
                            onClick={this.handleAttributeModalOpen}
                        />
                    </div>
                </form>
                <AttributesAddModal
                    isOpen={this.state.isAttributeModalOpen}
                    onRequestClose={this.onRequestAttributeModalClose}
                    onAdd={this.onAttributeAdd}
                />
            </View>
        );
    }
}

function UploadWithTimeout(props) {
    const config = useContext(ConfigContext);
    return (
        <Upload
            fileUploadTimeout={config.config["file_upload_timeout"]}
            {...props}
        />
    );
}

export default withRouter(UploadWithTimeout);
