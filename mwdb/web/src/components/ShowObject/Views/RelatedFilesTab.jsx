import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faExternalLinkSquare,
    faDownload,
    faTrash,
    faArchive,
} from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { ObjectContext } from "@mwdb-web/commons/context";
import {
    ObjectAction,
    ObjectTab,
    ConfirmationModal,
    getErrorMessage,
} from "@mwdb-web/commons/ui";
import { humanFileSize, downloadData } from "@mwdb-web/commons/helpers";
import ReactModal from "react-modal";

async function updateRelatedFiles(api, context) {
    const { updateObjectData } = context;
    try {
        let response = await api.getListOfRelatedFiles(context.object.sha256);
        updateObjectData({
            related_files: response.data.related_files,
        });
    } catch (error) {
        toast(getErrorMessage(error), {
            type: "error",
        });
    }
}

function RelatedFileItem({ file_name, file_size, sha256 }) {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);
    const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(null);
    const linkStyle = {
        display: "inline-block",
        padding: "8px",
    };
    const tdStyle = {
        padding: "10px 20px 10px 20px",
        width: "80%",
        borderRight: "none",
        borderLeft: "none",
    };

    return (
        <tr>
            <td style={tdStyle}>
                <span class="text-monospace">{file_name}</span>
                <br />
                <span class="text-muted">{humanFileSize(file_size)}</span>
            </td>
            <td align="right" style={tdStyle}>
                <Link
                    style={linkStyle}
                    to={`/file/${context.object.sha256}/related_files`}
                    className="nav-link"
                    onClick={async () => {
                        let content = await api.downloadRelatedFile(
                            context.object.sha256,
                            sha256
                        );
                        downloadData(
                            content.data,
                            file_name,
                            "application/octet-stream"
                        );
                    }}
                >
                    <FontAwesomeIcon icon={faDownload} size="lg" />
                </Link>
                <Link
                    style={linkStyle}
                    to={`/file/${context.object.sha256}/related_files`}
                    className="nav-link"
                    onClick={() => setConfirmationModalOpen(true)}
                >
                    <FontAwesomeIcon icon={faTrash} size="lg" />
                </Link>
                <ConfirmationModal
                    isOpen={isConfirmationModalOpen}
                    onRequestClose={() => {
                        setConfirmationModalOpen(false);
                    }}
                    onConfirm={async () => {
                        try {
                            await api.deleteRelatedFile(
                                context.object.sha256,
                                sha256
                            );
                            toast("Related file deleted successfully", {
                                type: "success",
                            });
                        } catch (error) {
                            toast(getErrorMessage(error), {
                                type: "error",
                            });
                        }
                        updateRelatedFiles(api, context);
                        setConfirmationModalOpen(false);
                    }}
                    message={`Are you sure you want to delete this related file?`}
                    buttonStyle="btn-success"
                    confirmText="Yes"
                />
            </td>
        </tr>
    );
}

function ShowRelatedFiles() {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);
    const { updateObjectData } = context;

    const getRelatedFiles = useCallback(updateRelatedFiles, [
        api,
        updateObjectData,
        context.object.sha256,
    ]);

    // JS throws a warning "Line ***:  React Hook useEffect has missing dependencies: 'api' and 'context'"
    // Those dependencies are skipped on purpose
    // To disable this warning I used 'eslint-disable-next-line'
    useEffect(() => {
        getRelatedFiles(api, context);
        // eslint-disable-next-line
    }, [getRelatedFiles]);

    if (!context.object.related_files) {
        return <div class="card-body text-muted">Loading...</div>;
    }
    if (context.object.related_files.length === 0) {
        return <div class="card-body text-muted">Nothing to show here</div>;
    }

    return (
        <table className="table table-striped table-bordered table-hover">
            <thead className="card-header">
                <th
                    style={{
                        textAlign: "left",
                        padding: "10px 20px 10px 20px",
                    }}
                >
                    File
                </th>
                <th
                    style={{
                        textAlign: "right",
                        padding: "10px 20px 10px 20px",
                    }}
                >
                    Actions
                </th>
            </thead>
            {context.object.related_files.map((related_file) => (
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
            updateRelatedFiles(api, context);
            toast("Related file uploaded successfully", {
                type: "success",
            });
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    async function handleDownloadAll() {
        window.location.href = await api.getZippedRelatedFilesLink(
            context.object.sha256
        );
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
                    <ObjectAction
                        label="Download all"
                        icon={faArchive}
                        action={handleDownloadAll}
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
                    }}
                >
                    <input
                        class="modal-header"
                        name="RelatedFileUploadField"
                        type="file"
                        required="required"
                        onChange={(event) => setFile(event.target.files[0])}
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
