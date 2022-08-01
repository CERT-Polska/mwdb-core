import React, { useContext } from "react";
import {
    Routes,
    Route,
    Navigate,
    useLocation,
    useParams,
} from "react-router-dom";

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
import UserRegister from "./components/UserRegister";
import UserSetPassword from "./components/UserSetPassword";
import Search from "./components/Search";
import RelationsPlot from "./components/RelationsPlot";
import UserPasswordRecover from "./components/UserPasswordRecover";
import Docs from "./components/Docs";
import RemoteViews from "./components/Remote/RemoteViews";
import ProfileView from "./components/Profile/ProfileView";
import SettingsView from "./components/Settings/SettingsView";

import ProfileDetails from "./components/Profile/Views/ProfileDetails";
import ProfileGroup from "./components/Profile/Views/ProfileGroup";
import ProfileGroupMembers from "./components/Profile/Views/ProfileGroupMembers";
import ProfileGroups from "./components/Profile/Views/ProfileGroups";
import ProfileCapabilities from "./components/Profile/Views/ProfileCapabilities";
import ProfileAPIKeys from "./components/Profile/Views/ProfileAPIKeys";
import ProfileResetPassword from "./components/Profile/Views/ProfileResetPassword";
import ProfileOAuth from "./components/Profile/Views/ProfileOAuth";

import { OAuthLogin, OAuthAuthorize } from "./components/OAuth";

import SettingsOverview from "./components/Settings/Views/SettingsOverview";
import UsersPendingList from "./components/Settings/Views/UsersPendingList";
import UsersList from "./components/Settings/Views/UsersList";
import UserCreate from "./components/Settings/Views/UserCreate";
import UserView from "./components/Settings/Views/UserView";
import GroupCreate from "./components/Settings/Views/GroupCreate";
import GroupView from "./components/Settings/Views/GroupView";
import GroupsList from "./components/Settings/Views/GroupsList";
import AccessControl from "./components/Settings/Views/AccessControl";
import OAuthListProviders from "./components/Settings/Views/OAuthListProviders";
import OAuthRegister from "./components/Settings/Views/OAuthRegister";
import OAuthProvider from "./components/Settings/Views/OAuthProvider";
import AttributesList from "./components/Settings/Views/AttributesList";
import AttributeCreate from "./components/Settings/Views/AttributeCreate";
import AttributeView from "./components/Settings/Views/AttributeView";
import { AttributeDetails } from "./components/Settings/Views/AttributeDetails";
import { AttributesPermissions } from "./components/Settings/Views/AttributePermissions";
import GroupDetails from "./components/Settings/Views/GroupDetails";
import GroupCapabilities from "./components/Settings/Views/GroupCapabilities";
import GroupMembers from "./components/Settings/Views/GroupMembers";
import UserDetails from "./components/Settings/Views/UserDetails";
import UserResetPassword from "./components/Settings/Views/UserResetPassword";
import UserSingleGroups from "./components/Settings/Views/UserSingleGroups";
import UserCapabilities from "./components/Settings/Views/UserCapabilities";
import UserAPIKeys from "./components/Settings/Views/UserAPIKeys";
import { AttributeEditTemplate } from "./components/Settings/Views/AttributeEditTemplate";

import { Capability } from "@mwdb-web/commons/auth";
import { ConfigContext } from "@mwdb-web/commons/config";
import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";
import {
    ErrorBoundary,
    RequiresAuth,
    RequiresCapability,
} from "@mwdb-web/commons/ui";

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

function AppRoutes() {
    const {
        config: { is_registration_enabled: isRegistrationEnabled },
    } = useContext(ConfigContext);
    return (
        <Routes>
            <Route path="login" element={<UserLogin />} />
            {isRegistrationEnabled ? (
                <Route path="register" element={<UserRegister />} />
            ) : (
                []
            )}
            <Route path="recover_password" element={<UserPasswordRecover />} />
            <Route path="setpasswd/:token" element={<UserSetPassword />} />
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
                        <RequiresCapability capability={Capability.addingFiles}>
                            <Upload />
                        </RequiresCapability>
                    }
                />
                <Route path="configs/stats" element={<ConfigStats />} />
                <Route path="about" element={<About />} />
                <Route path="docs" element={<Docs />} />
                <Route
                    path="sample/:hash/*"
                    element={<SampleRouteFallback />}
                />
                <Route path="file/:hash/*" element={<ShowSample />} />
                <Route path="config/:hash/*" element={<ShowConfig />} />
                <Route path="blob/:hash/*" element={<ShowTextBlob />} />
                <Route path="profile" element={<ProfileView />}>
                    <Route index element={<ProfileDetails />} />
                    <Route path="user/:user" element={<ProfileDetails />} />
                    <Route path="group/:group" element={<ProfileGroup />} />
                    <Route
                        path="group/:group/members"
                        element={<ProfileGroupMembers />}
                    />
                    <Route path="groups" element={<ProfileGroups />} />
                    <Route
                        path="capabilities"
                        element={<ProfileCapabilities />}
                    />
                    <Route path="api-keys" element={<ProfileAPIKeys />} />
                    <Route
                        path="reset-password"
                        element={<ProfileResetPassword />}
                    />
                    <Route path="oauth" element={<ProfileOAuth />} />
                </Route>
                <Route
                    path="diff/:current/:previous"
                    element={<DiffTextBlob />}
                />
                <Route path="relations" element={<RelationsPlot />} />
                <Route path="remote/:remote" element={<RemoteViews />}>
                    <Route index element={<RecentSamples />} />
                    <Route path="configs" element={<RecentConfigs />} />
                    <Route path="blobs" element={<RecentBlobs />} />
                    <Route path="search" element={<Search />} />
                    <Route path="file/:hash/*" element={<ShowSample />} />
                    <Route path="config/:hash/*" element={<ShowConfig />} />
                    <Route path="blob/:hash/*" element={<ShowTextBlob />} />
                    <Route
                        path="diff/:current/:previous"
                        element={<DiffTextBlob />}
                    />
                </Route>
                <Route
                    path="settings"
                    element={
                        <RequiresCapability capability={Capability.manageUsers}>
                            <SettingsView />
                        </RequiresCapability>
                    }
                >
                    <Route index element={<SettingsOverview />} />
                    <Route path="pending" element={<UsersPendingList />} />
                    <Route path="users" element={<UsersList />} />
                    <Route path="user/new" element={<UserCreate />} />
                    <Route path="user/:login" element={<UserView />}>
                        <Route index element={<UserDetails />} />
                        <Route
                            path="capabilities"
                            element={<UserCapabilities />}
                        />
                        <Route path="api-keys" element={<UserAPIKeys />} />
                        <Route
                            path="password"
                            element={<UserResetPassword />}
                        />
                        <Route path="groups" element={<UserSingleGroups />} />
                    </Route>
                    <Route path="groups" element={<GroupsList />} />
                    <Route path="group/new" element={<GroupCreate />} />
                    <Route path="group/:name" element={<GroupView />}>
                        <Route index element={<GroupDetails />} />
                        <Route
                            path="capabilities"
                            element={<GroupCapabilities />}
                        />
                        <Route path="members" element={<GroupMembers />} />
                    </Route>
                    <Route path="capabilities" element={<AccessControl />} />
                    <Route path="oauth" element={<OAuthListProviders />} />
                    <Route path="oauth/register" element={<OAuthRegister />} />
                    <Route path="oauth/:name" element={<OAuthProvider />} />
                    <Route path="attributes" element={<AttributesList />} />
                    <Route path="attribute/new" element={<AttributeCreate />} />
                    <Route
                        path="attribute/:attributeKey"
                        element={<AttributeView />}
                    >
                        <Route index element={<AttributeDetails />} />
                        <Route
                            path="permissions"
                            element={<AttributesPermissions />}
                        />
                        <Route
                            path="edit-template"
                            element={<AttributeEditTemplate />}
                        />
                    </Route>
                </Route>
                {fromPlugin("protectedRoutes")}
            </Route>
            {fromPlugin("routes")}
            <Route path="*" element={<NavigateFor404 />} />
        </Routes>
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
