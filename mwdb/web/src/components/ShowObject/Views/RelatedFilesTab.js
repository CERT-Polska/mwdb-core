import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faExternalLinkSquare,
    faDownload,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction, ObjectTab } from "@mwdb-web/commons/ui";
import { APIContext } from "@mwdb-web/commons/api/context";
import { humanFileSize } from "@mwdb-web/commons/helpers";
import ReactModal from "react-modal";

function ShowRelatedFiles() {
    const [relatedFiles, setRelatedFiles] = useState([]);
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);
    const { setObjectError, updateObjectData } = context;

    function RelatedFileItem({ file_name, file_size, sha256 }) {
        return (
            <tr>
                <td>{file_name}</td>
                <td>{humanFileSize(file_size)}</td>
                <td>
                    <Link
                        to={`/file/${context.object.sha256}/related_files`}
                        className="nav-link"
                        onClick={async () => {
                            let content = await api.downloadRelatedFile(sha256);
                            let blob = new Blob([content.data], {
                                type: "application/octet-stream",
                            });
                            let tempLink = document.createElement("a");
                            tempLink.style.display = "none";
                            tempLink.href = window.URL.createObjectURL(blob);
                            tempLink.download = file_name;
                            tempLink.click();
                        }}
                    >
                        <FontAwesomeIcon icon={faDownload} size="1x" />
                        &nbsp;Download
                    </Link>
                </td>
                <td>
                    <Link
                        to={`/file/${context.object.sha256}/related_files`}
                        className="nav-link"
                        onClick={async () => {
                            await api.deleteRelatedFile(sha256);
                            updateRelatedFiles();
                        }}
                    >
                        <FontAwesomeIcon icon={faTrash} size="1x" />
                        &nbsp;Remove
                    </Link>
                </td>
            </tr>
        );
    }

    async function updateRelatedFiles() {
        try {
            let response = await api.getListOfRelatedFiles(
                context.object.sha256
            );
            setRelatedFiles(response.data.related_files);
            updateObjectData({
                related_files: response.data.related_files,
            });
        } catch (error) {
            setObjectError(error);
        }
    }
    const getRelatedFiles = useCallback(updateRelatedFiles, [
        api,
        setObjectError,
        updateObjectData,
        context.object.sha256,
    ]);

    useEffect(() => {
        getRelatedFiles();
    }, [getRelatedFiles]);

    return (
        <table className="table table-striped table-bordered table-hover data-table">
            <thead>
                <th>File name</th>
                <th>File size</th>
                <th>Download</th>
                <th>Remove</th>
            </thead>
            {relatedFiles.map((related_file) => (
                <RelatedFileItem {...related_file} />
            ))}
        </table>
    );
}

export default function RelatedFilesTab() {
    const [showModal, setShowModal] = useState();
    const [file, setFile] = useState(null);
    const context = useContext(ObjectContext);
    const api = useContext(APIContext);
    const { setObjectError } = context;

    const modalStyle = {
        content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
        },
    };

    async function handleSubmit() {
        try {
            await api.uploadRelatedFile(file, context.object.sha256);
        } catch (error) {
            setObjectError(error);
        }
    }

    return (
        <div>
            <ObjectTab
                tab="related_files"
                label="Related files"
                icon={faExternalLinkSquare}
                component={ShowRelatedFiles}
                actions={[
                    <ObjectAction
                        label="Upload new"
                        icon={faPlus}
                        action={() => {
                            setShowModal(true);
                        }}
                    />,
                ]}
            />
            <ReactModal
                isOpen={showModal}
                onRequestClose={() => {
                    setShowModal(false);
                }}
                style={modalStyle}
            >
                <form
                    name="RelatedFileUploadForm"
                    onSubmit={() => {
                        handleSubmit();
                        setShowModal(false);
                        ShowRelatedFiles().updateRelatedFiles();
                    }}
                >
                    <input
                        class="modal-header"
                        name="RelatedFileUploadField"
                        type="file"
                        required="required"
                        onChange={() =>
                            setFile(
                                document.forms["RelatedFileUploadForm"][
                                    "RelatedFileUploadField"
                                ].files[0]
                            )
                        }
                    />
                    <div class="modal-footer">
                        <input
                            class="btn btn-success"
                            type="submit"
                            value="Submit related file"
                        />
                        <button
                            class="btn btn-secondary"
                            onClick={() => {
                                setShowModal(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </ReactModal>
        </div>
    );
}
