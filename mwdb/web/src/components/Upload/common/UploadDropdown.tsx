import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { NavDropdown } from "@mwdb-web/commons/ui";
import { Capability } from "@mwdb-web/types/types";
import { UploadButton } from "../../UploadButton";

export function UploadDropdown() {
    const uploadElement = [
        {
            capability: Capability.addingFiles,
            type: "File",
            link: "/file_upload",
        },
        {
            capability: Capability.addingBlobs,
            type: "Blob",
            link: "/blob_upload",
        },
        {
            capability: Capability.addingConfigs,
            type: "Config",
            link: "/config_upload",
        },
    ];
    return (
        <NavDropdown
            icon={faUpload}
            title="Upload"
            elements={uploadElement.map((ele) => {
                return (
                    <UploadButton
                        key={ele.type}
                        capability={ele.capability}
                        type={ele.type}
                        link={ele.link}
                    />
                );
            })}
        />
    );
}
