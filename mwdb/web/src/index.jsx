import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import { APIProvider } from "./commons/api";
import { AuthProvider } from "./commons/auth";
import { ConfigProvider } from "./commons/config";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "./styles/index.css";
import "swagger-ui-react/swagger-ui.css";

// Virtual module provided by Vite custom plugin
import { loadPlugins } from "./commons/plugins";

loadPlugins().then(() => {
    const root = createRoot(document.getElementById("root"));
    root.render(
        <BrowserRouter>
            <AuthProvider>
                <ConfigProvider>
                    <APIProvider>
                        <App />
                    </APIProvider>
                </ConfigProvider>
            </AuthProvider>
        </BrowserRouter>
    );
});
