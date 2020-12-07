import React, {Component} from 'react';
import { ConnectedRouter } from "connected-react-router";
import { bindActionCreators } from 'redux';
import { Switch, Route } from 'react-router-dom';
import { connect } from "react-redux";

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

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes, faUpload, faDownload, faPlus, faMinus, faRandom, 
         faExchangeAlt, faBan, faSearch, faToggleOn, faToggleOff, faSort, faSortUp, faSortDown, faProjectDiagram, faFile, faFileImage, faFilePdf,
         faFingerprint, faBoxes, faTrash, faCopy, faThumbtack, faStar } from '@fortawesome/free-solid-svg-icons'
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'

import { configActions } from '@mwdb-web/commons/config';
import { Extension } from "@mwdb-web/commons/extensions";
import history from "@mwdb-web/commons/history";
import { ProtectedRoute, View } from "@mwdb-web/commons/ui";
import { GlobalProvider } from "@mwdb-web/commons/context";
import ShowPendingUsers from './components/ShowPendingUsers';
import Docs from './components/Docs';

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

class App extends Component {
    componentDidMount() {
        this.props.configActions.init();
    }

    render() {
        const AuthenticatedRoute = (args) => (
            <ProtectedRoute condition={this.props.isAuthenticated} {...args} />
        )

        const AdministrativeRoute = (args) => (
            <ProtectedRoute condition={this.props.isAdmin} {...args} />
        )

        const AttributeRoute = (args) => (
            <ProtectedRoute condition={this.props.isAttributeManager} {...args} />
        )
        return (
            <ConnectedRouter history={history}>
                <GlobalProvider>
                    <div className="App">
                        <Navigation />

                        <div className="content">
                            <View fluid ident="main" style={{"padding": "0"}} {...this.props}>
                                {
                                    this.props.config !== null
                                    ? <Switch>
                                        <Route exact path='/login' component={UserLogin} />
                                        {
                                            this.props.isRegistrationEnabled
                                            ? <Route exact path="/register" component={UserRegister} />
                                            : []
                                        }
                                        <Route exact path='/recover_password' component={UserPasswordRecover} />
                                        <Route exact path='/setpasswd/:token' component={UserSetPassword} />
                                        <AuthenticatedRoute exact path='/' component={RecentSamples} />
                                        <AuthenticatedRoute exact path='/about' component={About} />
                                        <AuthenticatedRoute exact path='/docs' component={Docs} />
                                        <AuthenticatedRoute exact path='/profile/:login' component={UserProfile} />
                                        <AuthenticatedRoute exact path='/configs' component={RecentConfigs} />
                                        <AuthenticatedRoute exact path='/configs/stats' component={ConfigStats} />
                                        <AuthenticatedRoute exact path='/upload' component={Upload} />
                                        <AuthenticatedRoute path='/sample/:hash' component={ShowSample} />
                                        <AuthenticatedRoute path='/config/:hash' component={ShowConfig} />
                                        <AuthenticatedRoute path='/search' component={Search} />
                                        <AuthenticatedRoute path='/search_help' component={SearchHelp} />
                                        <AuthenticatedRoute path='/relations' component={RelationsPlot} />
                                        <AdministrativeRoute exact path="/user/:login" component={UserUpdate} />
                                        <AdministrativeRoute exact path="/users" component={ShowUsers} />
                                        <AdministrativeRoute exact path="/users/pending" component={ShowPendingUsers} />
                                        <AdministrativeRoute exact path="/users/new" component={UserCreate} />
                                        <AuthenticatedRoute exact path="/user_groups" component={UserGroups} />
                                        <AdministrativeRoute exact path="/groups" component={ShowGroups} />
                                        <AdministrativeRoute exact path="/groups/new" component={GroupRegister} />
                                        <AdministrativeRoute exact path="/group/:name" component={GroupUpdate} />
                                        <AttributeRoute exact path="/attribute/:metakey" component={AttributeUpdate}/>
                                        <AttributeRoute exact path="/attributes" component={ManageAttributes}/>
                                        <AttributeRoute exact path="/attributes/new" component={AttributeDefine}/>
                                        <AuthenticatedRoute exact path='/blobs' component={RecentBlobs} />
                                        <AuthenticatedRoute path='/blob/:hash' component={ShowTextBlob} />
                                        <AuthenticatedRoute path='/diff/:current/:previous' component={DiffTextBlob} />
                                        <Extension ident="routes" {...this.props}/>
                                    </Switch>
                                    : []
                                }
                            </View>
                        </div>
                    </div>
                </GlobalProvider>
            </ConnectedRouter>
        );
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        error: state.config.error,
        config: state.config.config,
        capabilities: state.auth.loggedUser ? state.auth.loggedUser.capabilities : [],
        isAuthenticated: !!state.auth.loggedUser,
        isAdmin: state.auth.loggedUser && state.auth.loggedUser.capabilities.indexOf("manage_users") >= 0,
        isAttributeManager: state.auth.loggedUser && state.auth.loggedUser.capabilities.indexOf("managing_attributes") >= 0,
        isRegistrationEnabled: state.config.config && state.config.config["is_registration_enabled"],
        userLogin: state.auth.loggedUser && state.auth.loggedUser.login,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        configActions: bindActionCreators(configActions, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
