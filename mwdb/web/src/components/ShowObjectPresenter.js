import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import api from "@mwdb-web/commons/api";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faFile, faTable, faScroll } from "@fortawesome/free-solid-svg-icons";

import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";
import { capitalize } from '@mwdb-web/commons/helpers';
import {ConfirmationModal} from "@mwdb-web/commons/ui";
import { GlobalContext } from "@mwdb-web/commons/context";

import RelationsPlot from './RelationsPlot';

import queryString from "query-string";

export function joinActions(currentActions, newActions) {
    let actions = {...currentActions};
    for(let tab of Object.keys(newActions))
        actions[tab] = newActions[tab].concat(actions[tab] || [])
    return actions
}

export default class ShowObjectPresenter extends Component {
    defaultTab = "details"

    static contextType = GlobalContext

    state = {
        isDeleteModalOpen: false,
        disableModalButton: false
    }

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
                this.setState({isDeleteModalOpen: false})
                if (this.props.type === "file") {
                    this.props.history.push("/")
                } else if (this.props.type === "text_blob") {
                    this.props.history.push("/blobs")
                } else {
                    this.props.history.push("/configs")
                }
            } catch(error) {
                this.context.update({
                    objectError: error,
                });
            }
    }

    addFavoriteObject = async () => {
        try {
            await api.addObjectFavorite(this.props.id)
            this.context.update({
                objectFavorite: true,
            });
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    }

    removeFavoriteObject = async () => {
        try {
            await api.removeObjectFavorite(this.props.id)
            this.context.update({
                objectFavorite: false,
            });
        } catch(error) {
            this.context.update({
                objectError: error,
            });
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

        let favorite = this.context.objectFavorite ?
            {label: "Unfavorite", icon: "star", action: (() => this.removeFavoriteObject())} :
            {label: "Favorite", icon: ["far","star"], action: (() => this.addFavoriteObject())}

        let actions = {
            details: [
                favorite,
                {label: "Download", icon: "download", action: (() => this.handleDownload())},
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

    get header() {
        const headerSpec = {
            "file": {
                icon: faFile,
                header: "File details"
            },
            "static_config": {
                icon: faTable,
                header: "Config details"
            },
            "text_blob": {
                icon: faScroll,
                header: "Blob details"
            }
        }[this.props.type]
        if(!headerSpec)
            return [];
        return (
            <div className="card-header detailed-view-header">
                <FontAwesomeIcon icon={headerSpec.icon}/>
                {headerSpec.header}
            </div>
        )
    }

    render() {
        let ObjectTab = (props) => {
            return (
                <li className="nav-item">
                    <Link to={this.getTabLink(props.tab)}
                          className={`nav-link ${this.currentTab === props.tab ? "active" : ""}`}>
                        { props.icon ? <FontAwesomeIcon icon={props.icon} size="1x"/> : [] }
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
                        { props.icon ? <FontAwesomeIcon icon={props.icon} size="1x"/> : [] }
                        { capitalize(props.label) }
                    </Link>
                </li>
            );
        }

        let Presenter = this.presenters[this.currentTab] || (() => <div />);

        return (
            <Extendable ident="showObjectPresenter" object={this.props}>
                {this.header}
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
                                   disabled={this.state.disableModalButton}
                                   onRequestClose={() => this.setState({isDeleteModalOpen: false})}
                                   onConfirm={(ev) => {
                                       ev.preventDefault();
                                       this.handleDeleteObject()
                                       this.setState({disableModalButton: true})
                                   }}/>
            </Extendable>
        );
    }
}
