import React, {Component} from 'react';
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import ShowObject from "./ShowObject";
import {ConfigTable} from "./ShowConfig";

import api from "@mwdb-web/commons/api";
import { makeSearchLink, makeSearchDateLink, downloadData } from '@mwdb-web/commons/helpers';
import { DataTable, View, DateString, HexView } from "@mwdb-web/commons/ui";
import { Extendable } from "@mwdb-web/commons/extensions";
import ShowObjectPresenter, {joinActions} from './ShowObjectPresenter';

function TextBlobDetails(props) {
    return (
        <DataTable>
            <Extendable ident="showTextBlobDetails" object={props}>
            <tr>
                <th>Blob name</th>
                <td id="blob_name"><Link to={makeSearchLink("name", props.blob_name, false, "blobs")}>{props.blob_name}</Link>
                </td>
            </tr>
            <tr>
                <th>Blob size</th>
                <td id="blob_size"><Link to={makeSearchLink("size", props.blob_size, false, "blobs")}>{props.blob_size}</Link>
                </td>
            </tr>
            <tr>
                <th>Blob type</th>
                <td id="blob_type"><Link to={makeSearchLink("type", props.blob_type, false, "blobs")}>{props.blob_type}</Link>
                </td>
            </tr>
            
            <tr>
                <th>First seen</th>
                <td id="upload_time"> {
                    props.upload_time
                        ? <Link to={makeSearchDateLink("upload_time", props.upload_time, "blobs")}><DateString date={props.upload_time}/></Link>
                        : []
                }</td>
            </tr>
            <tr>
                <th>Last seen</th>
                <td id="last_seen"> {
                    props.last_seen
                        ? <Link to={makeSearchDateLink("last_seen", props.last_seen, "blobs")}><DateString date={props.last_seen}/></Link>
                        : []
                }</td>
            </tr>
            </Extendable>
        </DataTable>);
}

class TextBlobPresenter extends ShowObjectPresenter {
    defaultTab = "preview"

    handleDownload = () => {
        downloadData(this.props.content, this.props.id, 'text/plain');
    };

    get presenters() {
        return {
            ...super.presenters,
            details: (props => <TextBlobDetails {...props} path={[]} />),
            preview: (props => <HexView content={props.content} mode="raw" showInvisibles/>),
            config: (props => props.latest_config ? <ConfigTable {...props.latest_config} /> : [])
        }
    }

    get tabs() {
        let tabs = super.tabs;
        if(this.props.latest_config)
            tabs = tabs.concat([{tab:"config", label: "Parsed blob"}])
        return tabs;
    }

    get actions() {
        let blobActions = {
            details: [
                {label: "Diff with", icon: "random", link: `/blobs?diff=${this.props.id}`}
            ],
            preview: [
                {label: "Diff with", icon: "random", link: `/blobs?diff=${this.props.id}`},
            ]
        }
        if(this.props.latest_config)
            blobActions['config'] = [
                {label: "Go to config", link: `/config/${this.props.latest_config.id}`}
            ]
        return joinActions(super.actions, blobActions);
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        canDeleteObject: state.auth.loggedUser.capabilities.includes("removing_objects"),
        router: state.router
    }
}

let ConnectedTextBlobPresenter = connect(mapStateToProps)(TextBlobPresenter);

class ShowTextBlob extends Component {
    state = {
        error: null,
        blob: {
            children: []
        }
    };

    updateTextBlob = async () => {
        try {
            let response = await api.getObject("blob", this.props.match.params.hash);
            this.setState({blob: response.data, error: null});
        } catch(error) {
            this.setState({error});
        }
    }

    componentDidMount() {
        this.updateTextBlob()
    }

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props)
            this.updateTextBlob();
    };

    render() {
        return (
            <View fluid ident="showTextBlob" error={this.state.error}>
                <ShowObject object={this.state.blob} 
                            objectPresenterComponent={ConnectedTextBlobPresenter}
                            searchEndpoint="blobs"
                            onObjectUpdate={this.updateTextBlob}
                            history={this.props.history}/>
            </View>
        );
    }
}

export default ShowTextBlob;
