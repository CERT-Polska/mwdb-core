import React, {Component} from 'react';
import { connect } from "react-redux";
import {Link} from 'react-router-dom';
import ShowObject from "./ShowObject";

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'

import api from "@mwdb-web/commons/api";
import { makeSearchLink, makeSearchDateLink, downloadData } from "@mwdb-web/commons/helpers";
import { Extension } from "@mwdb-web/commons/extensions";
import { DataTable, DateString, ObjectLink, View, HexView, ActionCopyToClipboard } from "@mwdb-web/commons/ui";
import ShowObjectPresenter from './ShowObjectPresenter';
import { GlobalContext } from "@mwdb-web/commons/context";

class ConfigRow extends Component {
    constructor(props){
        super(props)

        this.state = {
            open: false,
            name: this.props.name,
        }

        if(this.isValueObject()) {
            this.state.raw = this.state.value = JSON.stringify(this.props.value, null, 4)
        } else 
        if(this.isValueBlob()) {
            this.state.raw = this.props.value["in-blob"];
            this.state.value = <ObjectLink type="blob" id={this.props.value["in-blob"]} className="blob" />
        } else {
            this.state.raw = this.state.value = String(this.props.value)
            this.state.value = (
                <Link to={`${(makeSearchLink(`cfg.${this.props.path.join('.')}`, this.props.value, false, "configs"))}`}>
                    {this.state.value}
                </Link>
            )
        }
    }

    isValueObject() {
        return this.props.value && typeof this.props.value === 'object' && !this.props.value["in-blob"];
    }

    isValueBlob() {
        return this.props.value && typeof this.props.value === 'object' && this.props.value["in-blob"];
    }

    componentDidMount() {
        if(this.props.parentExpanded && this.isValueObject())
            this.setState({open: true})
    }

    componentDidUpdate(prevProps) {
        if(this.props.parentExpanded !== prevProps.parentExpanded && this.props.parentExpanded && this.isValueObject())
            this.setState({open: true})
    }

    _toggle() {
        this.setState({
            open: !this.state.open
        })
    }

    render() { 
        const overflow = {
            maxWidth: '700px',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
        }

        return (
            <React.Fragment>
                <tr className="flickerable">
                    <th style={{cursor: 'pointer'}} onClick={this._toggle.bind(this)}>
                        <FontAwesomeIcon icon={this.state.open ? "minus" : "plus"} size="sm"/>&nbsp;
                        {this.state.name}
                    </th>
                    {this.state.open && !this.isValueObject() ? (
                        <td>
                            <pre style={{whiteSpace: 'pre-wrap'}}>{this.state.raw}</pre>
                        </td>
                    ) : (
                        <td id={this.state.name} style={overflow} className="text-monospace">
                            {this.state.value}
                            <span className="ml-2">
                                <ActionCopyToClipboard text={this.state.raw} tooltipMessage="Copy value to clipboard"/>
                            </span>
                        </td>
                    )}
                </tr>
                {this.state.open && this.isValueObject() ? (
                    <tr className="nested">
                        <td className="nested" colspan="2" style={{ padding: 0 }}>
                            <ConfigTable cfg={this.props.value}
                                         parentExpanded={true}
                                         indent={ this.props.indent + 1}
                                         path={ this.props.path }/>
                        </td>
                    </tr>
                ) : []}
            </React.Fragment>
        )
    }
}

export class ConfigTable extends Component {
    configKeys() {
        let keys = Object.keys(this.props.cfg);
        if(!Array.isArray(this.props.cfg))
            return keys.sort()
        return keys
    }

    render() {
        const indentLevel = this.props.indent || 0
        const currentPath = this.props.path || []

        function TopLevel(props) {
            return !indentLevel ? props.children : []
        }

        return (
            <DataTable indent={this.props.indent}>
                <TopLevel>
                    <Extension ident={"showConfigDetailsBefore"} object={this.props}/>
                    <tr key="config-family">
                        <th>Family</th>
                        <td id="config_family"><a href={makeSearchLink("family", this.props.family, false, "configs")}>{this.props.family}</a></td>
                    </tr>
                    <tr key="config-type">
                        <th>Config type</th>
                        <td id="config_family"><a href={makeSearchLink("type", this.props.config_type, false, "configs")}>{this.props.config_type}</a></td>
                    </tr>
                </TopLevel>
                {this.configKeys().map(
                    (configKey) => {
                        const path = (
                            Array.isArray(this.props.cfg)
                            // If Array: add the asterisk to the last element
                            ? [
                                ...currentPath.slice(0, -1),
                                currentPath[currentPath.length - 1] + "*"
                            ]
                            // Else: just add next key to the path
                            : currentPath.concat([configKey])
                        )
                        return <ConfigRow name={configKey} key={configKey} 
                                          value={this.props.cfg[configKey]} 
                                          parentExpanded={this.props.parentExpanded}
                                          path={path}
                                          indent={indentLevel} />;
                    })
                }
                <TopLevel>
                    <tr key="config-upload-time">
                        <th>Upload time</th>
                        <td id="upload_time"> {
                            this.props.upload_time
                                ? <a href={makeSearchDateLink("upload_time", this.props.upload_time, "configs")}>
                                    <DateString date={this.props.upload_time}/>
                                  </a>
                                : []
                        }</td>
                    </tr>
                    <Extension ident={"showConfigDetailsAfter"} object={this.props}/>
                </TopLevel>
            </DataTable>
        )
    }
}

class ConfigPresenter extends ShowObjectPresenter {
    handleDownload = () => {
        downloadData(JSON.stringify(this.props.cfg), this.props.id, 'application/json');
    };

    get presenters() {
        return {
            ...super.presenters,
            details: (props => <ConfigTable {...props} />),
            preview: (props => <HexView content={JSON.stringify(props.cfg, null, 4)} mode="raw" json/>)
        }
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

let ConnectedConfigPresenter = connect(mapStateToProps)(ConfigPresenter);

class ShowConfig extends Component {
    state = {
        config: {
            cfg: {}
        }
    };

    static contextType = GlobalContext

    updateConfig = async () => {
        try {
            let response = await api.getObject("config", this.props.match.params.hash)
            this.setState({
                config: response.data
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
        this.updateConfig()
    }

    componentDidUpdate(prevProps) {
        if (prevProps && prevProps.match.params.hash !== this.props.match.params.hash)
            this.updateConfig();
    };

    render() {
        return (
            <View fluid ident="showConfig" error={this.context.objectError}>
                <ShowObject object={this.state.config} 
                            objectPresenterComponent={ConnectedConfigPresenter}
                            searchEndpoint='configs'
                            onObjectUpdate={this.updateConfig}
                            history={this.props.history} />
            </View>
        );
    }
}

export default ShowConfig;
