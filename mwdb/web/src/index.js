import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import { APIProvider } from "@mwdb-web/commons/api/provider";
import { AuthProvider } from "@mwdb-web/commons/auth";
import { ConfigProvider } from "@mwdb-web/commons/config";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "./styles/index.css";
import "swagger-ui-react/swagger-ui.css";

ReactDOM.render(
    <BrowserRouter>
        <ConfigProvider>
            <AuthProvider>
                <APIProvider>
                    <App />
                </APIProvider>
            </AuthProvider>
        </ConfigProvider>
    </BrowserRouter>,
    document.getElementById("root")
);
