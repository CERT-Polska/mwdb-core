import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "@mwdb-web/commons/auth";
import { UploadDropdown } from "@mwdb-web/components/Upload/common/UploadDropdown";
import { Capability } from "@mwdb-web/types/types";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { faUpload } from "@fortawesome/free-solid-svg-icons";

export function Upload() {
    const auth = useContext(AuthContext);
    const uploadCapabilities = [
        Capability.addingFiles,
        Capability.addingBlobs,
        Capability.addingConfigs,
    ];

    const accessToUploadCapabilities = uploadCapabilities.map((cap) => {
        return auth.hasCapability(cap);
    });

    const renderSingleUpload = () => {
        let name = "";
        let linkTo = "";

        if (auth.hasCapability(Capability.addingFiles)) {
            name = "Upload";
            linkTo = "/upload";
        }
        if (auth.hasCapability(Capability.addingBlobs)) {
            name = "Upload blob";
            linkTo = "/blob_upload";
        }
        if (auth.hasCapability(Capability.addingConfigs)) {
            name = "Upload config";
            linkTo = "/config_upload";
        }
        return (
            <Link className="nav-link" to={linkTo}>
                <FontAwesomeIcon className="navbar-icon" icon={faUpload} />
                {name}
            </Link>
        );
    };

    const result = () => {
        const uploadCapabilitiesQuantity = accessToUploadCapabilities.filter(
            (value) => value
        ).length;

        if (uploadCapabilitiesQuantity === 1) {
            return renderSingleUpload();
        }
        if (uploadCapabilitiesQuantity > 1) {
            return <UploadDropdown />;
        }

        return <></>;
    };

    return result();
}
