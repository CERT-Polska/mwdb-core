import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { App } from "./App";

import { APIProvider } from "./commons/api";
import { AuthProvider } from "./commons/auth";
import { ConfigProvider } from "./commons/config";

import "bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "./styles/index.css";
import "swagger-ui-react/swagger-ui.css";
import "react-toastify/dist/ReactToastify.css";

// Virtual module provided by Vite custom plugin
import { loadPlugins } from "./commons/plugins";

loadPlugins().then(() => {
    const root = createRoot(document.getElementById("root"));
    root.render(
        <BrowserRouter>
            <ToastContainer position="top-center" />
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
