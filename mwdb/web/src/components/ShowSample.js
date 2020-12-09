import React, {Component} from 'react';
import { connect } from "react-redux";
import {Link} from 'react-router-dom';
import ShowObject from "./ShowObject";
import {ConfigTable} from "./ShowConfig";

import api from "@mwdb-web/commons/api";
import {makeSearchLink, makeSearchDateLink, humanFileSize} from "@mwdb-web/commons/helpers";
import { Extendable } from "@mwdb-web/commons/extensions";
import { DataTable, DateString, Hash, View, ActionCopyToClipboard } from "@mwdb-web/commons/ui";
import { GlobalContext } from "@mwdb-web/commons/context"
import ShowObjectPresenter, {joinActions} from './ShowObjectPresenter';
import ShowSamplePreview from "./ShowSamplePreview";

function SampleDetails(props) {
    return (
        <DataTable>
            <Extendable ident="showSampleDetails" object={props}>
                <tr className="flickerable">
                    <th>File name</th>
                    <td id="file_name">
                        <Link to={makeSearchLink("name", props.file_name, false, '')}>
                            {props.file_name}
                        </Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.file_name} tooltipMessage="Copy file name to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>File size</th>
                    <td id="file_size">
                        <Link to={makeSearchLink("size", props.file_size, false, '')}>{humanFileSize(props.file_size)}</Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.file_size} tooltipMessage="Copy file size to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>File type</th>
                    <td id="file_type">
                        <Link to={makeSearchLink("type", props.file_type, false, '')}>{props.file_type}</Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.file_type} tooltipMessage="Copy file type to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>md5</th>
                    <td id="md5">
                        <Hash hash={props.md5} inline/>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.md5} tooltipMessage="Copy md5 to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha1</th>
                    <td id="sha1">
                        <Hash hash={props.sha1} inline/>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.sha1} tooltipMessage="Copy sha1 to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha256</th>
                    <td id="sha256">
                        <Hash hash={props.sha256} inline/>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.sha256} tooltipMessage="Copy sha256 to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>sha512</th>
                    <td id="sha512">
                        <Hash hash={props.sha512} inline/>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.sha512} tooltipMessage="Copy sha512 to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>crc32</th>
                    <td id="crc32" className="text-monospace">
                        {props.crc32}
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.crc32} tooltipMessage="Copy crc32 to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr className="flickerable">
                    <th>ssdeep</th>
                    <td id="ssdeep" className="text-monospace">
                        <Link to={makeSearchLink("ssdeep", props.ssdeep, false, '')}>{props.ssdeep}</Link>
                        <span className="ml-2">
                            <ActionCopyToClipboard text={props.ssdeep} tooltipMessage="Copy ssdeep to clipboard"/>
                        </span>
                    </td>
                </tr>
                <tr>
                    <th>Upload time</th>
                    <td id="upload_time"> {
                        props.upload_time
                            ? <Link to={makeSearchDateLink("upload_time", props.upload_time, '')}><DateString date={props.upload_time}/></Link>
                            : []
                    }</td>
                </tr>
            </Extendable>
        </DataTable>);
}

function SamplePreview(props) {
    return <ShowSamplePreview hash={props.id} mode={props.subtab || "raw"}/>
}

class SamplePresenter extends ShowObjectPresenter {
    handleDownload = async (event) => {
        let response = await api.requestFileDownload(this.props.sha256)
        window.location.href = api.getApiForEnvironment().replace(/\/$/g, '') + response.data.url;
    };

    get presenters() {
        return {
            ...super.presenters,
            details: SampleDetails,
            preview: SamplePreview,
            config: (props => props.latest_config ? <ConfigTable {...props.latest_config} /> : [])
        }
    }

    get tabs() {
        let tabs = super.tabs;
        if(this.props.latest_config)
            tabs = tabs.concat([{
                tab: "config", 
                label: (
                    <div>Static config {
                        this.props.latest_config.family 
                         ? <span class="badge badge-danger">{this.props.latest_config.family}</span>
                         : []
                    }</div>)}])
        return tabs;
    }

    get actions() {
        let sampleActions = {
            details: (this.props.canAddParent ? [
                {label: "Upload child", icon: "plus", link: "/upload?parent="+this.props.id}
            ] : []),
            preview: [
                (this.currentSubTab === "hex" 
                 ? {label: "Raw view", link: this.getTabLink("preview","raw")}
                 : {label: "Hex view", link: this.getTabLink("preview","hex")})
            ],
            config: [
                {label: "Go to config", action: () => this.props.history.push("/config/"+this.props.latest_config.id)}
            ]
        }
        return joinActions(super.actions, sampleActions);
    }
}

function mapStateToProps(state, ownProps)
{
    // SamplePresenter needs to know whether the user is allowed to add parents ("Add child option")
    return {
        ...ownProps,
        canAddParent: state.auth.loggedUser.capabilities.includes("adding_parents"),
        isAdmin: state.auth.loggedUser.capabilities.includes("manage_users"),
        canDeleteObject: state.auth.loggedUser.capabilities.includes("removing_objects"),
        router: state.router
    }
}

let ConnectedSamplePresenter = connect(mapStateToProps)(SamplePresenter);

export default class ShowSample extends Component {
    state = {
        file: {
            children: []
        }
    };

    static contextType = GlobalContext

    updateSample = async () => {
        try {
            let response = await api.getObject("file", this.props.match.params.hash)
            this.setState({
                file: response.data
            });
            this.context.update({
                objectFavorite: response.data.favorite,
                objectError: null,
            });
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    }

    componentDidMount() {
        this.updateSample()
    }

    componentDidUpdate(prevProps) {
        if (prevProps && prevProps.match.params.hash !== this.props.match.params.hash)
            this.updateSample();
    };

    render() {
        return (
            <View fluid ident="showSample" error={this.context.objectError}>
                <ShowObject object={this.state.file}
                            objectPresenterComponent={ConnectedSamplePresenter}
                            searchEndpoint=''
                            onObjectUpdate={this.updateSample}
                            history={this.props.history} />
            </View>
        );
    }
}
