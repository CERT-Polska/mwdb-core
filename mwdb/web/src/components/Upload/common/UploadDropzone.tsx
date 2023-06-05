import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";

type Props = {
    onDrop: (data: File) => void;
    file: File | null;
};

export function UploadDropzone(props: Props) {
    const onDrop = props.onDrop;
    const { getRootProps, getInputProps, isDragActive, isDragReject } =
        useDropzone({
            multiple: false,
            onDrop: useCallback(
                (acceptedFiles: any) => onDrop(acceptedFiles[0]),
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
                        <FontAwesomeIcon icon={faUpload} />
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
