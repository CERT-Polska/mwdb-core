import { useContext } from "react";
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
import { SettingsView } from "./components/Settings/Views/SettingsView";

import ProfileDetails from "./components/Profile/Views/ProfileDetails";
import ProfileGroup from "./components/Profile/Views/ProfileGroup";
import ProfileGroupMembers from "./components/Profile/Views/ProfileGroupMembers";
import ProfileGroups from "./components/Profile/Views/ProfileGroups";
import ProfileAPIKeys from "./components/Profile/Views/ProfileAPIKeys";
import ProfileResetPassword from "./components/Profile/Views/ProfileResetPassword";
import ProfileOAuth from "./components/Profile/Views/ProfileOAuth";

import { OAuthAuthorize } from "./components/OAuth";

import { SettingsOverviewView } from "./components/Settings/Views/SettingsOverviewView";
import { UsersPendingListView } from "./components/Settings/Views/UsersPendingListView";
import { UsersListView } from "./components/Settings/Views/UsersListView";
import { UserCreateView } from "./components/Settings/Views/UserCreateView";
import { UserView } from "./components/Settings/Views/UserView";
import { GroupCreateView } from "./components/Settings/Views/GroupCreateView";
import { GroupView } from "./components/Settings/Views/GroupView";
import { GroupsListView } from "./components/Settings/Views/GroupsListView";
import { AccessControlView } from "./components/Settings/Views/AccessControlView";
import { OAuthListProvidersView } from "./components/Settings/Views/OAuthListProvidersView";
import { OAuthRegisterView } from "./components/Settings/Views/OAuthRegisterView";
import { OAuthProviderView } from "./components/Settings/Views/OAuthProviderView";
import { AttributesListView } from "./components/Settings/Views/AttributesListView";
import { AttributeCreateView } from "./components/Settings/Views/AttributeCreateView";
import { AttributeView } from "./components/Settings/Views/AttributeView";
import { AttributeDetailsView } from "./components/Settings/Views/AttributeDetailsView";
import { AttributesPermissionsView } from "./components/Settings/Views/AttributePermissionsView";
import { GroupDetailsView } from "./components/Settings/Views/GroupDetailsView";
import { GroupCapabilitiesView } from "./components/Settings/Views/GroupCapabilitiesView";
import { GroupMembersView } from "./components/Settings/Views/GroupMembersView";
import { UserDetailsView } from "./components/Settings/Views/UserDetailsView";
import { UserResetPasswordView } from "./components/Settings/Views/UserResetPasswordView";
import { UserSingleGroupsView } from "./components/Settings/Views/UserSingleGroupsView";
import { UserCapabilitiesView } from "./components/Settings/Views/UserCapabilitiesView";
import { UserAPIKeysView } from "./components/Settings/Views/UserAPIKeysView";
import { AttributeEditTemplateView } from "./components/Settings/Views/AttributeEditTemplateView";

import { ConfigContext } from "./commons/config";
import { fromPlugins, Extendable } from "./commons/plugins";
import { ErrorBoundary, RequiresAuth, RequiresCapability } from "./commons/ui";

import { Capability } from "@mwdb-web/types/types";

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
    return (
        <Routes>
            <Route path="login" element={<UserLogin />} />
            <Route path="register" element={<UserRegister />} />
            <Route path="recover_password" element={<UserPasswordRecover />} />
            <Route path="setpasswd" element={<UserSetPassword />} />
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
                        element={<UserCapabilitiesView />}
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
                    <Route index element={<SettingsOverviewView />} />
                    <Route path="pending" element={<UsersPendingListView />} />
                    <Route path="users" element={<UsersListView />} />
                    <Route path="user/new" element={<UserCreateView />} />
                    <Route path="user/:login/*" element={<UserView />}>
                        <Route index element={<UserDetailsView />} />
                        <Route
                            path="capabilities"
                            element={<UserCapabilitiesView />}
                        />
                        <Route path="api-keys" element={<UserAPIKeysView />} />
                        <Route
                            path="password"
                            element={<UserResetPasswordView />}
                        />
                        <Route
                            path="groups"
                            element={<UserSingleGroupsView />}
                        />
                    </Route>
                    <Route path="groups" element={<GroupsListView />} />
                    <Route path="group/new" element={<GroupCreateView />} />
                    <Route path="group/:name/*" element={<GroupView />}>
                        <Route index element={<GroupDetailsView />} />
                        <Route
                            path="capabilities"
                            element={<GroupCapabilitiesView />}
                        />
                        <Route path="members" element={<GroupMembersView />} />
                    </Route>
                    <Route
                        path="capabilities"
                        element={<AccessControlView />}
                    />
                    <Route path="oauth" element={<OAuthListProvidersView />} />
                    <Route
                        path="oauth/register"
                        element={<OAuthRegisterView />}
                    />
                    <Route path="oauth/:name" element={<OAuthProviderView />} />
                    <Route path="attributes" element={<AttributesListView />} />
                    <Route
                        path="attribute/new"
                        element={<AttributeCreateView />}
                    />
                    <Route
                        path="attribute/:attributeKey/*"
                        element={<AttributeView />}
                    >
                        <Route index element={<AttributeDetailsView />} />
                        <Route
                            path="permissions"
                            element={<AttributesPermissionsView />}
                        />
                        <Route
                            path="edit-template"
                            element={<AttributeEditTemplateView />}
                        />
                    </Route>
                </Route>
                {fromPlugins("protectedRoutes")}
            </Route>
            {fromPlugins("routes")}
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
