import { useContext } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";

export function AdminNav() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);

    if (!auth.isAdmin) return <></>;
    return (
        <li className="nav-item">
            <Link className="nav-link" to={"/settings"}>
                Settings
                {config.pendingUsers.length ? (
                    <span
                        className="badge badge-pill badge-warning"
                        style={{ marginLeft: "8px" }}
                    >
                        {config.pendingUsers.length}
                    </span>
                ) : (
                    <></>
                )}
            </Link>
        </li>
    );
}
