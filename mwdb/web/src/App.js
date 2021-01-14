import React, { useContext } from 'react';
import { Switch, Route } from 'react-router-dom';

import About from './components/About';
import Navigation from './components/Navigation';
import RecentConfigs from './components/RecentConfigs';
import RecentSamples from './components/RecentSamples';
import ConfigStats from './components/ConfigStats';
import RecentBlobs from './components/RecentBlobs';
import ShowSample from './components/ShowSample';
import ShowConfig from './components/ShowConfig';
import ShowTextBlob from './components/ShowTextBlob';
import DiffTextBlob from './components/DiffTextBlob';
import Upload from './components/Upload';
import UserLogin from './components/UserLogin';
import UserProfile from './components/UserProfile';
import ShowUsers from "./components/ShowUsers";
import ShowGroups from "./components/ShowGroups";
import UserCreate from "./components/UserCreate";
import UserRegister from "./components/UserRegister";
import UserUpdate from "./components/UserUpdate";
import UserGroups from "./components/UserGroups"
import GroupRegister from "./components/GroupRegister";
import GroupUpdate from "./components/GroupUpdate";
import UserSetPassword from "./components/UserSetPassword";
import ManageAttributes from './components/ManageAttributes';
import AttributeDefine from './components/AttributeDefine';
import AttributeUpdate from './components/AttributeUpdate';
import Search, { SearchHelp } from "./components/Search";
import RelationsPlot from './components/RelationsPlot';
import UserPasswordRecover from './components/UserPasswordRecover';
import ShowPendingUsers from './components/ShowPendingUsers';
import Docs from './components/Docs';

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes, faUpload, faDownload, faPlus, faMinus, faRandom, 
         faExchangeAlt, faBan, faSearch, faToggleOn, faToggleOff, faSort, faSortUp, faSortDown, faProjectDiagram, faFile, faFileImage, faFilePdf,
         faFingerprint, faBoxes, faTrash, faCopy, faThumbtack, faStar } from '@fortawesome/free-solid-svg-icons'
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'

import { AuthContext } from '@mwdb-web/commons/auth';
import { ConfigContext } from '@mwdb-web/commons/config';
import { Extension } from "@mwdb-web/commons/extensions";
import { ProtectedRoute, View } from "@mwdb-web/commons/ui";

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

export default function App() {
    const auth = useContext(AuthContext);
    const config = useContext(ConfigContext);

    const AuthenticatedRoute = (args) => (
        <ProtectedRoute condition={auth.isAuthenticated} {...args} />
    )

    const AdministrativeRoute = (args) => (
        <ProtectedRoute condition={auth.isAdmin} {...args} />
    )

    const AttributeRoute = (args) => (
        <ProtectedRoute condition={auth.hasCapability("managing_attributes")} {...args} />
    )
    
    const Main = (
        config.config
        ? () => (
            <Switch>
                <Route exact path='/login' component={UserLogin} />
                {
                    config.config["is_registration_enabled"]
                    ? <Route exact path="/register" component={UserRegister} />
                    : []
                }
                <Route exact path='/recover_password' component={UserPasswordRecover} />
                <Route exact path='/setpasswd/:token' component={UserSetPassword} />
                <AuthenticatedRoute exact path='/' component={RecentSamples} />
                <AuthenticatedRoute exact path='/configs' component={RecentConfigs} />
                <AuthenticatedRoute exact path='/blobs' component={RecentBlobs} />
                <AuthenticatedRoute exact path='/upload' component={Upload} />
                <AuthenticatedRoute path='/search' component={Search} />
                <AuthenticatedRoute path='/search_help' component={SearchHelp} />
                <AuthenticatedRoute exact path='/configs/stats' component={ConfigStats} />
                <AuthenticatedRoute exact path='/about' component={About} />
                <AuthenticatedRoute exact path='/docs' component={Docs} />
                <AuthenticatedRoute exact path='/profile/:login' component={UserProfile} />
                <AuthenticatedRoute path='/sample/:hash' component={ShowSample} />
                <AuthenticatedRoute path='/config/:hash' component={ShowConfig} />
                <AuthenticatedRoute path='/blob/:hash' component={ShowTextBlob} />
                <AuthenticatedRoute path='/diff/:current/:previous' component={DiffTextBlob} />
                <AuthenticatedRoute path='/relations' component={RelationsPlot} />
                <AuthenticatedRoute exact path="/user_groups" component={UserGroups} />
                <AdministrativeRoute exact path="/user/:login" component={UserUpdate} />
                <AdministrativeRoute exact path="/users" component={ShowUsers} />
                <AdministrativeRoute exact path="/users/pending" component={ShowPendingUsers} />
                <AdministrativeRoute exact path="/users/new" component={UserCreate} />
                <AdministrativeRoute exact path="/groups" component={ShowGroups} />
                <AdministrativeRoute exact path="/groups/new" component={GroupRegister} />
                <AdministrativeRoute exact path="/group/:name" component={GroupUpdate} />
                <AttributeRoute exact path="/attribute/:metakey" component={AttributeUpdate}/>
                <AttributeRoute exact path="/attributes" component={ManageAttributes}/>
                <AttributeRoute exact path="/attributes/new" component={AttributeDefine}/>
                <Extension ident="routes"/>
            </Switch>
        )
        : () => []
    )

    return (
        <div className="App">
            <Navigation />
            <div className="content">
                <View fluid ident="main" style={{"padding": "0"}} error={config.configError}>
                    <Main/>
                </View>
            </div>
        </div>
    )
}
