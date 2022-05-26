import React, { useContext } from "react";
import { Switch } from "react-router-dom";
import {
    Routes,
    Route,
    CompatRoute,
    Navigate,
    Outlet,
    useLocation,
    useParams,
} from "react-router-dom-v5-compat";

import About from "./components/About";
import Navigation from "./components/Navigation";
import RecentConfigs from "./components/RecentConfigs";
import RecentSamples from "./components/RecentSamples";
import ConfigStats from "./components/ConfigStats";
import RecentBlobs from "./components/RecentBlobs";
import ShowSample from "./components/ShowSample";
import ShowConfig from "./components/ShowConfig";
import ShowTextBlob from "./components/ShowTextBlob";
import DiffTextBlob from "./components/DiffTextBlob";
import UploadWithTimeout from "./components/Upload";
import UserLogin from "./components/UserLogin";
import UserRegister from "./components/UserRegister";
import UserSetPassword from "./components/UserSetPassword";
import Search from "./components/Search";
import RelationsPlot from "./components/RelationsPlot";
import UserPasswordRecover from "./components/UserPasswordRecover";
import Docs from "./components/Docs";
import RemoteViews from "./components/Remote/RemoteViews";
import ProfileView from "./components/Profile/ProfileView";
import SettingsView from "./components/Settings/SettingsView";

import { OAuthLogin, OAuthAuthorize } from "./components/OAuth";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
    faTimes,
    faUpload,
    faDownload,
    faPlus,
    faMinus,
    faRandom,
    faExchangeAlt,
    faBan,
    faSearch,
    faToggleOn,
    faToggleOff,
    faSort,
    faSortUp,
    faSortDown,
    faProjectDiagram,
    faFile,
    faFileImage,
    faFilePdf,
    faFingerprint,
    faBoxes,
    faTrash,
    faCopy,
    faThumbtack,
    faStar,
    faEdit,
    faSave,
    faLock,
    faLockOpen,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";

import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { fromPlugin } from "@mwdb-web/commons/extensions";
import { ErrorBoundary, ProtectedRoute } from "@mwdb-web/commons/ui";
import { Extendable } from "./commons/extensions";

library.add(faTimes);
library.add(faUpload);
library.add(faDownload);
library.add(faPlus);
library.add(faMinus);
library.add(faRandom);
library.add(faExchangeAlt);
library.add(faBan);
library.add(faSearch);
library.add(faToggleOn);
library.add(faToggleOff);
library.add(faSort);
library.add(faSortUp);
library.add(faSortDown);
library.add(faProjectDiagram);
library.add(faFile);
library.add(faFileImage);
library.add(faFilePdf);
library.add(faFingerprint);
library.add(faBoxes);
library.add(faTrash);
library.add(faCopy);
library.add(faThumbtack);
library.add(faStar);
library.add(farStar);
library.add(faEdit);
library.add(faSave);
library.add(faLock);
library.add(faLockOpen);

function NavigateFor404() {
    /**
     * Fallback route for unknown routes
     */
    const location = useLocation();
    return (
        <Navigate
            to="/"
            state={{
                error: `Location '${location.pathname}' doesn't exist`,
            }}
        />
    );
}

function SampleRouteFallback() {
    /**
     * Fallback route for legacy /sample/:hash route
     */
    const { hash } = useParams();
    return <Navigate to={`/file/${hash}`} />;
}

function RequiresAuth({ children }) {
    /**
     * Wrapper for views that require authentication
     */
    const auth = useContext(AuthContext);
    const location = useLocation();
    if (!auth.isAuthenticated)
        return (
            <Navigate
                to="/login"
                state={{
                    prevLocation: location,
                    error: "You need to authenticate before accessing this page",
                }}
            />
        );
    return children ? children : <Outlet />;
}

function RequiresCapability({ capability, children }) {
    /**
     * Wrapper for views that require additional capability
     */
    const auth = useContext(AuthContext);
    const location = useLocation();
    if (!auth.hasCapability(capability))
        return (
            <Navigate
                to="/"
                state={{
                    error: `You don't have permission to access '${location.pathname}'`,
                }}
            />
        );
    return children ? children : <Outlet />;
}

function AppRoutes() {
    const auth = useContext(AuthContext);
    const {
        config: { is_registration_enabled: isRegistrationEnabled },
    } = useContext(ConfigContext);
    return (
        <Switch>
            {/**
             * React Router v5 legacy routes
             */}
            <ProtectedRoute path="/file/:hash">
                <ShowSample />
            </ProtectedRoute>
            <ProtectedRoute path="/config/:hash">
                <ShowConfig />
            </ProtectedRoute>
            <ProtectedRoute path="/blob/:hash">
                <ShowTextBlob />
            </ProtectedRoute>
            <ProtectedRoute path="/diff/:current/:previous">
                <DiffTextBlob />
            </ProtectedRoute>
            <ProtectedRoute path="/relations">
                <RelationsPlot />
            </ProtectedRoute>
            <ProtectedRoute path="/remote/:remote">
                <RemoteViews />
            </ProtectedRoute>
            <ProtectedRoute
                condition={auth.hasCapability(Capability.manageUsers)}
                path="/settings"
            >
                <SettingsView />
            </ProtectedRoute>
            <ProtectedRoute path={["/profile/user/:user", "/profile"]}>
                <ProfileView />
            </ProtectedRoute>
            {fromPlugin("routes")}
            {/**
             * React Router v6-compatible routes
             * CompatRoute is v6 wrapper that is compatible with v5 and catches
             * everything that wasn't catched by rules above.
             */}
            <CompatRoute path="">
                <Routes>
                    <Route path="login" element={<UserLogin />} />
                    {isRegistrationEnabled ? (
                        <Route path="register" element={<UserRegister />} />
                    ) : (
                        []
                    )}
                    <Route
                        path="recover_password"
                        element={<UserPasswordRecover />}
                    />
                    <Route
                        path="setpasswd/:token"
                        element={<UserSetPassword />}
                    />
                    <Route path="oauth/login" element={<OAuthLogin />} />
                    <Route path="oauth/callback" element={<OAuthAuthorize />} />
                    <Route element={<RequiresAuth />}>
                        <Route path="/" element={<RecentSamples />} />
                        <Route path="configs" element={<RecentConfigs />} />
                        <Route path="blobs" element={<RecentBlobs />} />
                        <Route path="search" element={<Search />} />
                        <Route
                            path="upload"
                            element={
                                <RequiresCapability
                                    capability={Capability.addingFiles}
                                >
                                    <UploadWithTimeout />
                                </RequiresCapability>
                            }
                        />
                        <Route path="configs/stats" element={<ConfigStats />} />
                        <Route path="about" element={<About />} />
                        <Route path="docs" element={<Docs />} />
                        <Route
                            path="sample/:hash"
                            element={<SampleRouteFallback />}
                        />
                    </Route>
                    <Route path="*" element={<NavigateFor404 />} />
                </Routes>
            </CompatRoute>
        </Switch>
    );
}

export default function App() {
    const config = useContext(ConfigContext);
    return (
        <div className="App">
            <Navigation />
            <div className="content">
                <ErrorBoundary error={config.error}>
                    <Extendable ident="main">
                        {config.isReady ? <AppRoutes /> : []}
                    </Extendable>
                </ErrorBoundary>
            </div>
        </div>
    );
}
