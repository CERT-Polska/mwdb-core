import { useContext } from "react";
import { Navigation } from "./components/Navigation";

import { ConfigContext } from "./commons/config";
import { Extendable } from "./commons/plugins";
import { ErrorBoundary } from "./commons/ui";
import { AppRoutes } from "./commons/navigation/AppRoutes";
import { VersionMismatchWarning } from "@mwdb-web/components/VersionMismatchWarning";

import { version as clientVersion } from "../package.json";

export function App() {
    const config = useContext(ConfigContext);
    return (
        <div className="App">
            <Navigation />
            <div className="content">
                {config.isReady ? (
                    <VersionMismatchWarning
                        clientVersion={clientVersion}
                        serverVersion={config.config.server_version}
                    />
                ) : (
                    []
                )}
                <ErrorBoundary>
                    <Extendable ident="main">
                        {config.isReady ? <AppRoutes /> : []}
                    </Extendable>
                </ErrorBoundary>
            </div>
        </div>
    );
}
