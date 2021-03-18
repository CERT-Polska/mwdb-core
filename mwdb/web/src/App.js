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
import RemoteShowSample from "./components/Remote/RemoteShowSample";
import RemoteShowConfig from "./components/Remote/RemoteShowConfig";
import RemoteShowTextBlob from "./components/Remote/RemoteShowTextBlob";
import RemoteRecentSamples from "./components/Remote/RemoteRecentSamples";
import RemoteRecentConfigs from "./components/Remote/RemoteRecentConfigs";
import RemoteRecentBlobs from "./components/Remote/RemoteRecentBlobs";
import RemoteDiffTextBlob from "./components/Remote/RemoteDiffTextBlob";
import RemoteSearch from "./components/Remote/RemoteSearch";

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

import { AuthContext } from "@mwdb-web/commons/auth";
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

function AuthenticatedRoute(args) {
    const auth = useContext(AuthContext);
    return <ProtectedRoute condition={auth.isAuthenticated} {...args} />;
}

function AdministrativeRoute(args) {
    const auth = useContext(AuthContext);
    return <ProtectedRoute condition={auth.isAdmin} {...args} />;
}

function AttributeRoute(args) {
    const auth = useContext(AuthContext);
    return (
        <ProtectedRoute
            condition={auth.hasCapability("managing_attributes")}
            {...args}
        />
    );
}

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
            <Route exact path="/login" component={UserLogin} />
            {config.config["is_registration_enabled"] ? (
                <Route exact path="/register" component={UserRegister} />
            ) : (
                []
            )}
            <Route
                exact
                path="/recover_password"
                component={UserPasswordRecover}
            />
            <Route exact path="/setpasswd/:token" component={UserSetPassword} />
            <AuthenticatedRoute exact path="/" component={RecentSamples} />
            <AuthenticatedRoute
                exact
                path="/configs"
                component={RecentConfigs}
            />
            <AuthenticatedRoute exact path="/blobs" component={RecentBlobs} />
            <AuthenticatedRoute exact path="/upload" component={Upload} />
            <AuthenticatedRoute path="/search" component={Search} />
            <AuthenticatedRoute path="/search_help" component={SearchHelp} />
            <AuthenticatedRoute
                exact
                path="/configs/stats"
                component={ConfigStats}
            />
            <AuthenticatedRoute exact path="/about" component={About} />
            <AuthenticatedRoute exact path="/docs" component={Docs} />
            <AuthenticatedRoute
                exact
                path="/profile/:login"
                component={UserProfile}
            />
            <Redirect from="/sample/:hash" to="/file/:hash" />
            <AuthenticatedRoute path="/file/:hash" component={ShowSample} />
            <AuthenticatedRoute path="/config/:hash" component={ShowConfig} />
            <AuthenticatedRoute path="/blob/:hash" component={ShowTextBlob} />
            <AuthenticatedRoute
                path="/diff/:current/:previous"
                component={DiffTextBlob}
            />
            <AuthenticatedRoute path="/relations" component={RelationsPlot} />
            <AuthenticatedRoute
                exact
                path="/user_groups"
                component={UserGroups}
            />
            <AdministrativeRoute
                exact
                path="/user/:login"
                component={UserUpdate}
            />
            <AdministrativeRoute exact path="/users" component={ShowUsers} />
            <AdministrativeRoute
                exact
                path="/users/pending"
                component={ShowPendingUsers}
            />
            <AdministrativeRoute
                exact
                path="/users/new"
                component={UserCreate}
            />
            <AdministrativeRoute exact path="/groups" component={ShowGroups} />
            <AdministrativeRoute
                exact
                path="/groups/new"
                component={GroupRegister}
            />
            <AdministrativeRoute
                exact
                path="/group/:name"
                component={GroupUpdate}
            />
            <AttributeRoute
                exact
                path="/attribute/:metakey"
                component={AttributeUpdate}
            />
            <AttributeRoute
                exact
                path="/attributes"
                component={ManageAttributes}
            />
            <AttributeRoute
                exact
                path="/attributes/new"
                component={AttributeDefine}
            />
            <AuthenticatedRoute
                exact
                path="/remote/:remote"
                component={RemoteRecentSamples}
            />
            <AuthenticatedRoute
                exact
                path="/remote/:remote/configs"
                component={RemoteRecentConfigs}
            />
            <AuthenticatedRoute
                exact
                path="/remote/:remote/blobs"
                component={RemoteRecentBlobs}
            />
            <AuthenticatedRoute
                path="/remote/:remote/file/:hash"
                component={RemoteShowSample}
            />
            <AuthenticatedRoute
                path="/remote/:remote/config/:hash"
                component={RemoteShowConfig}
            />
            <AuthenticatedRoute
                path="/remote/:remote/blob/:hash"
                component={RemoteShowTextBlob}
            />
            <AuthenticatedRoute
                path="/remote/:remote/diff/:current/:previous"
                component={RemoteDiffTextBlob}
            />
            <AuthenticatedRoute
                path="/remote/:remote/search"
                component={RemoteSearch}
            />
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
