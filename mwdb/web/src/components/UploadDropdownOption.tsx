import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "@mwdb-web/commons/auth";
import { Capability } from "@mwdb-web/types/types";
import { useContext } from "react";
import { Link } from "react-router-dom";

type Props = {
    capability: Capability;
    type: string;
    link: string;
};

export function UploadDropdownOption({ capability, type, link }: Props) {
    const auth = useContext(AuthContext);

    return auth.hasCapability(capability) ? (
        <Link className="dropdown-item" to={link}>
            {type}
        </Link>
    ) : (
        <></>
    );
}
