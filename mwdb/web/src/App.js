import React, { useContext } from "react";
import { Switch, Route, Redirect, useLocation } from "react-router-dom";

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

function DefaultRoute() {
    const location = useLocation();
    return (
        <Route>
            <Redirect
                to={{
                    pathname: "/",
                    state: {
                        error: `Location '${location.pathname}' doesn't exist`,
                    },
                }}
            />
        </Route>
    );
}

function SettingsRoute(args) {
    const auth = useContext(AuthContext);
    return (
        <ProtectedRoute
            condition={auth.hasCapability(Capability.manageUsers)}
            {...args}
        >
            <SettingsView />
        </ProtectedRoute>
    );
}

export default function App() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);

    const routeSwitch = config.isReady ? (
        <Switch>
            <Route exact path="/login">
                <UserLogin />
            </Route>
            {config.config["is_registration_enabled"] ? (
                <Route exact path="/register">
                    <UserRegister />
                </Route>
            ) : (
                []
            )}
            <Route exact path="/recover_password">
                <UserPasswordRecover />
            </Route>
            <Route exact path="/setpasswd/:token">
                <UserSetPassword />
            </Route>
            <Route exact path="/oauth/login">
                <OAuthLogin />
            </Route>
            <Route exact path="/oauth/callback">
                <OAuthAuthorize />
            </Route>
            <ProtectedRoute exact path="/">
                {
                    /*
                        BUG: react-router doesn't re-render on search path change
                        when we have direct component here
                    */
                    () => <RecentSamples />
                }
            </ProtectedRoute>
            <ProtectedRoute exact path="/configs">
                {() => <RecentConfigs />}
            </ProtectedRoute>
            <ProtectedRoute exact path="/blobs">
                {() => <RecentBlobs />}
            </ProtectedRoute>
            <ProtectedRoute
                exact
                path="/upload"
                condition={auth.hasCapability(Capability.addingFiles)}
            >
                <UploadWithTimeout />
            </ProtectedRoute>
            <ProtectedRoute exact path="/search">
                {() => <Search />}
            </ProtectedRoute>
            <ProtectedRoute exact path="/configs/stats">
                <ConfigStats />
            </ProtectedRoute>
            <ProtectedRoute exact path="/about">
                <About />
            </ProtectedRoute>
            <ProtectedRoute exact path="/docs">
                <Docs />
            </ProtectedRoute>
            <Redirect from="/sample/:hash" to="/file/:hash" />
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
            <SettingsRoute path="/settings" />
            <ProtectedRoute path={["/profile/user/:user", "/profile"]}>
                <ProfileView />
            </ProtectedRoute>
            {fromPlugin("routes")}
            <DefaultRoute />
        </Switch>
    ) : (
        []
    );

    return (
        <div className="App">
            <Navigation />
            <div className="content">
                <ErrorBoundary error={config.error}>
                    <Extendable ident="main">{routeSwitch}</Extendable>
                </ErrorBoundary>
            </div>
        </div>
    );
}
