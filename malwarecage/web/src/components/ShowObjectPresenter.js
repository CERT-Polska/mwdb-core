import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import api from "@malwarefront/api";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import { fromPlugin, Extendable } from "@malwarefront/extensions";
import { capitalize } from '@malwarefront/helpers';
import {ConfirmationModal} from "@malwarefront/ui";

import RelationsPlot from './RelationsPlot';

import queryString from "query-string";

export function joinActions(currentActions, newActions) {
    let actions = {...currentActions};
    for(let tab of Object.keys(newActions))
        actions[tab] = newActions[tab].concat(actions[tab] || [])
    return actions
}

export default class ShowObjectPresenter extends Component {
    state = {
        isDeleteModalOpen: false
    }
    defaultTab = "details"

    getTabLink(tab, subtab) {
        let pathElements = this.props.history.location.pathname.split("/");
        let newPath = pathElements.slice(0, 3).concat([tab]).concat(subtab ? [subtab] : []).join("/");
        return newPath
    }

    get currentTab() {
        return this.props.history.location.pathname.split("/")[3] || this.defaultTab;
    }

    get currentSubTab() {
        return this.props.history.location.pathname.split("/")[4];
    }

    /* Overridable */
    handleDownload = () => {}

    handleDeleteObject = async () => {
            try {
                await api.removeObject(this.props.id)
                if (this.props.type === "file") {
                    this.props.history.push("/")
                } else if (this.props.type === "text_blob") {
                    this.props.history.push("/blobs")
                } else {
                    this.props.history.push("/configs")
                }
            } catch (error) {
                console.log(error)
            }
    }

    /* Overridable */
    get tabs() {
        let tabs = [
            {tab: "details", icon: "fingerprint"},
            {tab: "relations", icon: "project-diagram"},
            {tab: "preview", icon: "search"}
        ]
        for(let extraTabs of fromPlugin("objectTabs"))
        {
            tabs = [
                ...tabs,
                ...extraTabs
            ]
        }
        return tabs;
    }

    /* Overridable */
    get actions() {
        let nodes = queryString.parse(this.props.history.location.search, {arrayFormat: 'bracket'}).node || [];
        let actions = {
            details: [
                {label: "Download", icon: "download", action: (() => this.handleDownload())}
            ],
            relations: [
                {label: "zoom", icon: "search", link: "/relations?node[]=" + [this.props.id, ...nodes].join("&node[]=")}
            ],
            preview: [
                {label: "Download", icon: "download", action: (() => this.handleDownload())}
            ]
        }
        for(let extraActions of fromPlugin("objectActions"))
            actions = joinActions(actions, extraActions)

        if (this.props.canDeleteObject){
            actions.details.push(
                {label: "Remove", icon: "trash", action: (() => this.setState({isDeleteModalOpen: true}))}
            )
        }
        return actions;
    }

    /* Overridable */
    get presenters() {
        let extraPresenters = {}
        for(let presenters of fromPlugin("objectPresenters"))
            extraPresenters = {...extraPresenters, ...presenters}
        return {
            relations: (props => props.id ? <RelationsPlot hash={props.id} height="600"/> : []),
            ...extraPresenters
        }
    }

    render() {
        let ObjectTab = (props) => {
            return (
                <li className="nav-item">
                    <Link to={this.getTabLink(props.tab)}
                          className={`nav-link ${this.currentTab === props.tab ? "active" : ""}`}>
                        { props.icon ? <FontAwesomeIcon icon={props.icon} pull="left" size="1x"/> : [] }
                        { props.label || capitalize(props.tab) }
                    </Link>
                </li>
            );
        }

        let ObjectAction = (props) => {
            return (
                <li className="nav-item">
                    <Link to={props.link ? props.link : "#"}
                          className="nav-link" 
                          onClick={() => props.action && props.action()}
                         >
                        { props.icon ? <FontAwesomeIcon icon={props.icon} pull="left" size="1x"/> : [] }
                        { capitalize(props.label) }
                    </Link>
                </li>
            );
        }

        let Presenter = this.presenters[this.currentTab] || (() => <div />);

        return (
            <Extendable ident="showObjectPresenter" object={this.props}>
                <div className="card-header" style={{wordBreak: "break-all"}}>
                    <div className="media row">
                        <Extendable ident="showObjectHeader" object={this.props}>
                            {this.renderHeader()}
                        </Extendable>
                    </div>
                </div>
                <nav className="navbar navbar-expand-sm bg-white">
                    <ul className="nav nav-tabs mr-auto">
                        <Extendable ident="showObjectTabs" object={this.props}>
                            {this.tabs.map(params => <ObjectTab key={params.tab} {...params} />)}
                        </Extendable>
                    </ul>
                    <ul className="nav nav-pills ml-auto">
                        <Extendable ident="showObjectActions" object={this.props}>
                            {(this.actions[this.currentTab] || []).map(params => <ObjectAction key={params.label} {...params}/>)}
                        </Extendable>
                    </ul>
                </nav>
                {
                    Presenter({
                        subtab: this.currentSubTab,
                        ...this.props
                    })
                }
                <ConfirmationModal buttonStyle="badge-success"
                               confirmText="Yes"
                               message="Are you sure you want to delete this object?"
                               isOpen={this.state.isDeleteModalOpen}
                               onRequestClose={() => this.setState({isDeleteModalOpen: false})}
                               onConfirm={(ev) => {
                                   ev.preventDefault();
                                   this.handleDeleteObject()
                                   this.setState({isDeleteModalOpen: false})
                               }}/>
            </Extendable>
        );
    }
}
