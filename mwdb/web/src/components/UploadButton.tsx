import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext, Capabilities } from "@mwdb-web/commons/auth";
import { useContext } from "react";
import { Link } from "react-router-dom";

export function UploadButton() {
    const auth = useContext(AuthContext);
    const buttonLink = auth.hasCapability(Capabilities.addingFiles) ? (
        <Link className="nav-link" to={"/upload"}>
            <FontAwesomeIcon className="navbar-icon" icon={faUpload} />
            Upload
        </Link>
    ) : (
        <div className="nav-link text-muted">
            <span
                data-toggle="tooltip"
                title="File upload is disabled for your account"
            >
                <FontAwesomeIcon className="navbar-icon" icon={faUpload} />
                Upload
            </span>
        </div>
    );
    return buttonLink;
}
