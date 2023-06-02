import { useContext } from "react";
import { Navigation } from "./components/Navigation";

import { ConfigContext } from "./commons/config";
import { Extendable } from "./commons/plugins";
import { ErrorBoundary } from "./commons/ui";
import { AppRoutes } from "./commons/navigation/AppRoutes";

export function App() {
    const config = useContext(ConfigContext);
    return (
        <div className="App">
            <Navigation />
            <div className="content">
                <ErrorBoundary>
                    <Extendable ident="main">
                        {config.isReady ? <AppRoutes /> : []}
                    </Extendable>
                </ErrorBoundary>
            </div>
        </div>
    );
}
