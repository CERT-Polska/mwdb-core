import { useContext } from "react";
import { NavLink } from "react-router-dom";

import { faUserCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ConfigContext } from "@mwdb-web/commons/config";

export function ProfileNav() {
    const config = useContext(ConfigContext);

    return (
        <div>
            <strong>
                <FontAwesomeIcon icon={faUserCog} /> Profile
            </strong>
            <div className="nav sidenav flex-column">
                <NavLink end to="/profile" className="nav-link">
                    Profile details
                </NavLink>
                <NavLink end to="/profile/capabilities" className="nav-link">
                    Capabilities
                </NavLink>
                <NavLink end to="/profile/groups" className="nav-link">
                    Groups
                </NavLink>
                <NavLink end to="/profile/api-keys" className="nav-link">
                    API keys
                </NavLink>
                {config.config["is_oidc_enabled"] && (
                    <NavLink end to="/profile/oauth" className="nav-link">
                        OpenID Connect
                    </NavLink>
                )}
            </div>
            <hr />
        </div>
    );
}
