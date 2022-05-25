import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import App from "./App";

import { APIProvider } from "@mwdb-web/commons/api/provider";
import { AuthProvider } from "@mwdb-web/commons/auth";
import { ConfigProvider } from "@mwdb-web/commons/config";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "./styles/index.css";
import "swagger-ui-react/swagger-ui.css";

const root = createRoot(document.getElementById("root"));
root.render(
    <BrowserRouter>
        <CompatRouter>
            <AuthProvider>
                <ConfigProvider>
                    <APIProvider>
                        <App />
                    </APIProvider>
                </ConfigProvider>
            </AuthProvider>
        </CompatRouter>
    </BrowserRouter>
);
