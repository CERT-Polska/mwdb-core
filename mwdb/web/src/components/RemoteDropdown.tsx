import { useContext } from "react";
import { Link } from "react-router-dom";

import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { ConfigContext } from "@mwdb-web/commons/config";
import { NavDropdown } from "@mwdb-web/commons/ui";

export function RemoteDropdown() {
    const config = useContext(ConfigContext);
    if (!config.isReady) return <></>;

    const remotes = config.config.remotes || [];
    const remoteItems = remotes.map((remote) => (
        <Link key="remote" className="dropdown-item" to={`/remote/${remote}`}>
            {remote}
        </Link>
    ));

    return (
        <NavDropdown
            title="Switch to remote..."
            elements={[...remoteItems]}
            icon={faGlobe}
        />
    );
}
