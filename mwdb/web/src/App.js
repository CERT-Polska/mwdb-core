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
import Upload from "./components/Upload";
import UserLogin from "./components/UserLogin";
import UserProfile from "./components/UserProfile";
import ShowUsers from "./components/ShowUsers";
import ShowGroups from "./components/ShowGroups";
import UserCreate from "./components/UserCreate";
import UserRegister from "./components/UserRegister";
import UserUpdate from "./components/UserUpdate";
import UserGroups from "./components/UserGroups";
import GroupRegister from "./components/GroupRegister";
import GroupUpdate from "./components/GroupUpdate";
import UserSetPassword from "./components/UserSetPassword";
import ManageAttributes from "./components/ManageAttributes";
import AttributeDefine from "./components/AttributeDefine";
import AttributeUpdate from "./components/AttributeUpdate";
import Search, { SearchHelp } from "./components/Search";
import RelationsPlot from "./components/RelationsPlot";
import UserPasswordRecover from "./components/UserPasswordRecover";
import ShowPendingUsers from "./components/ShowPendingUsers";
import Docs from "./components/Docs";
import RemoteViews from "./components/Remote/RemoteViews";
import SettingsView from "./components/Settings/SettingsView";

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
} from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";

import { ConfigContext } from "@mwdb-web/commons/config";
import { fromPlugin } from "@mwdb-web/commons/extensions";
import {
    ErrorBoundary,
    ProtectedRoute,
    AdministrativeRoute,
    AttributeRoute,
} from "@mwdb-web/commons/ui";
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

export default function App() {
    const config = useContext(ConfigContext);

    const routeSwitch = config.config ? (
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
            <ProtectedRoute exact path="/">
                <RecentSamples />
            </ProtectedRoute>
            <ProtectedRoute exact path="/configs">
                <RecentConfigs />
            </ProtectedRoute>
            <ProtectedRoute exact path="/blobs">
                <RecentBlobs />
            </ProtectedRoute>
            <ProtectedRoute exact path="/upload">
                <Upload />
            </ProtectedRoute>
            <ProtectedRoute exact path="/search">
                <Search />
            </ProtectedRoute>
            <ProtectedRoute exact path="/search_help">
                <SearchHelp />
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
            <ProtectedRoute exact path="/profile/:login">
                <UserProfile />
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
            <ProtectedRoute exact path="/user_groups">
                <UserGroups />
            </ProtectedRoute>
            <AdministrativeRoute exact path="/user/:login">
                <UserUpdate />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/users">
                <ShowUsers />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/users/pending">
                <ShowPendingUsers />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/users/new">
                <UserCreate />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/groups">
                <ShowGroups />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/groups/new">
                <GroupRegister />
            </AdministrativeRoute>
            <AdministrativeRoute exact path="/group/:name">
                <GroupUpdate />
            </AdministrativeRoute>
            <AttributeRoute exact path="/attribute/:metakey">
                <AttributeUpdate />
            </AttributeRoute>
            <AttributeRoute exact path="/attributes">
                <ManageAttributes />
            </AttributeRoute>
            <AttributeRoute exact path="/attributes/new">
                <AttributeDefine />
            </AttributeRoute>
            <ProtectedRoute path="/remote/:remote">
                <RemoteViews />
            </ProtectedRoute>
            <ProtectedRoute path="/settings">
                <SettingsView />
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
