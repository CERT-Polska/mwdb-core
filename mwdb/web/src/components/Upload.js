import React, { useCallback, useContext, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import AttributesAddModal from "./AttributesAddModal";

import api from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { Autocomplete, DataTable, View } from "@mwdb-web/commons/ui";
import { ConfigContext } from "@mwdb-web/commons/config";
import { Extendable } from "@mwdb-web/commons/extensions";

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
                        <FontAwesomeIcon icon={faUpload} size="x" />
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

export default function Upload() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);
    const fileUploadTimeout = config.config["file_upload_timeout"];
    const navigate = useNavigate();
    const searchParams = useSearchParams()[0];

    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [shareWith, setShareWith] = useState("default");
    const [group, setGroup] = useState("");
    const [groups, setGroups] = useState([]);
    const [parent, setParent] = useState("");
    const [attributes, setAttributes] = useState([]);
    const [attributeModalOpen, setAttributeModalOpen] = useState(false);

    const handleParentChange = (ev) => {
        ev.preventDefault();
        setParent(ev.target.value);
    };

    const handleParentClear = () => {
        if (searchParams.get("parent")) navigate("/upload");
        setParent("");
    };

    async function updateGroups() {
        try {
            let response = await api.getShareInfo();
            let groups = response.data.groups;
            groups.splice(groups.indexOf("public"), 1);
            groups.splice(groups.indexOf(auth.user.login), 1);
            setGroups(groups);
            setShareWith(groups.length > 0 ? "default" : "private");
        } catch (error) {
            setError(error);
        }
    }

    const getGroups = useCallback(updateGroups, [auth.user.login]);

    useEffect(() => {
        getGroups();
    }, [getGroups]);

    const updateSharingMode = (ev) => {
        setShareWith(ev.target.value);
        setGroup("");
    };

    const sharingModeToUploadParam = () => {
        if (shareWith === "default") return "*";
        else if (shareWith === "public") return "public";
        else if (shareWith === "private") return "private";
        else if (shareWith === "single") return group;
    };

    const getSharingModeHint = () => {
        if (shareWith === "default")
            return `The sample and all related artifacts will be shared with all your workgroups`;
        else if (shareWith === "public")
            return `The sample will be added to the public feed, so everyone will see it.`;
        else if (shareWith === "private")
            return `The sample will be accessible only from your account.`;
        else if (shareWith === "single")
            return `The sample will be accessible only for you and chosen group.`;
    };

    const handleSubmit = async () => {
        try {
            let response = await api.uploadFile(
                file,
                searchParams.get("parent") || parent,
                sharingModeToUploadParam(),
                attributes,
                fileUploadTimeout
            );
            navigate("/file/" + response.data.sha256, {
                state: { success: "File uploaded successfully." },
                replace: true,
            });
        } catch (error) {
            setError(error);
        }
    };

    const onAttributeAdd = (key, value) => {
        for (let attr of this.state.attributes)
            if (attr.key === key && attr.value === value) {
                // that key, value was added yet
                setAttributeModalOpen(false);
                return;
            }
        setAttributes([...attributes, { key: value }]);
        setAttributeModalOpen(false);
    };

    const onAttributeRemove = (idx) => {
        setAttributes([
            ...attributes.slice(0, idx),
            ...attributes.slice(idx + 1),
        ]);
    };

    return (
        <View ident="upload" error={error} showIf={groups !== null}>
            <Extendable ident="uploadForm">
                <form>
                    <UploadDropzone
                        file={file}
                        onDrop={(data) => setFile(data)}
                    />
                    <div className="form-group">
                        {auth.hasCapability(Capability.addingParents) ? (
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
                                    value={searchParams.get("parent") || parent}
                                    onChange={handleParentChange}
                                    disabled={searchParams.get("parent")}
                                />
                                <div className="input-group-append">
                                    <input
                                        className="btn btn-outline-danger"
                                        type="button"
                                        value="Clear"
                                        onClick={handleParentClear}
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
                                value={shareWith}
                                onChange={updateSharingMode}
                            >
                                {groups.length
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
                                {getSharingModeHint()}
                            </div>
                        </div>
                        {shareWith === "single" ? (
                            <div className="mb-3">
                                <Autocomplete
                                    value={group}
                                    items={groups.filter(
                                        (item) =>
                                            item
                                                .toLowerCase()
                                                .indexOf(
                                                    group.toLowerCase()
                                                ) !== -1
                                    )}
                                    onChange={(value) => setGroup(value)}
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
                        {attributes.length > 0 ? (
                            <div>
                                <h5>Attributes</h5>
                                <DataTable>
                                    {attributes.map((attr, idx) => (
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
                                                        onAttributeRemove(idx)
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
                            onClick={handleSubmit}
                            disabled={!file}
                        />
                        <input
                            value="Add attribute"
                            className="btn btn-success"
                            type="button"
                            onClick={() => setAttributeModalOpen(true)}
                        />
                    </div>
                </form>
            </Extendable>
            <AttributesAddModal
                isOpen={attributeModalOpen}
                onRequestClose={() => setAttributeModalOpen(false)}
                onAdd={onAttributeAdd}
            />
        </View>
    );
}
