import React, {Component} from 'react';
import { connect } from "react-redux";
import AttributesAddModal from './AttributesAddModal';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import api from "@mwdb-web/commons/api";
import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";
import { DataTable, ConfirmationModal, ActionCopyToClipboard } from "@mwdb-web/commons/ui";
import { GlobalContext } from "@mwdb-web/commons/context";

let attributeRenderers = {}

for(let extraRenderers of fromPlugin("attributeRenderers")) {
    attributeRenderers = {...attributeRenderers, ...extraRenderers}
}

class DefaultAttributeRenderer extends Component {
    state = {
        collapsed: true,
        isAttributeDeleteModalOpen: false,
        attributeToRemove: null
    }

    static contextType = GlobalContext;

    get isCollapsible() {
        return this.props.values.length > 3
    }

    toggle() {
        this.setState({collapsed: !this.state.collapsed})
    }

    handleDeleteAttribute = async () => {
        try {
            await api.removeObjectMetakey(this.props.object.type, this.props.object.id, this.state.attributeToRemove.key, this.state.attributeToRemove.value);
            this.props.onUpdateAttributes();
            this.setState({
                isAttributeDeleteModalOpen: false,
                attributeToRemove: null
            })
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    }

    render() {
        let visibleValues = this.props.values;
        if(this.state.collapsed)
            visibleValues = visibleValues.slice(0, 3);
        return (
            <tr key={this.props.label}>
                <th onClick={ev => {ev.preventDefault(); this.toggle()}}>
                    {
                        this.isCollapsible ?
                        <FontAwesomeIcon icon={this.state.collapsed ? "plus" : "minus"} size="sm"/>
                        : []
                    }&nbsp;
                    {this.props.label}
                </th>
                <td className="flickerable">
                    { visibleValues.map(attr => (
                        <div key={attr.value}>
                            {
                                attr.url 
                                ? <a href={attr.url}>{attr.value}</a>
                                : <span>{attr.value}</span>
                            }
                            <span className="ml-2">
                                <ActionCopyToClipboard text={attr.value} tooltipMessage="Copy value to clipboard"/>
                            </span>
                            {this.props.canDeleteAttributes &&
                            <span className="ml-2"
                                  data-toggle="tooltip"
                                  title="Remove attribute value from this object."
                                  onClick={() => this.setState(
                                      {
                                          isAttributeDeleteModalOpen: true,
                                          attributeToRemove: {
                                              key: attr.key,
                                              value: attr.value
                                          }
                                      })
                                  }>
                                <i>
                                    <FontAwesomeIcon icon={"trash"}
                                                     size="sm"
                                                     style={{cursor: "pointer"}}/>
                                </i>
                            </span>}
                            <ConfirmationModal buttonStyle="btn-danger"
                                   confirmText="Yes"
                                   cancelText="No"
                                   message="Are you sure you want to remove this attribute from the object?"
                                   isOpen={this.state.isAttributeDeleteModalOpen}
                                   onRequestClose={() => this.setState({isAttributeDeleteModalOpen: false})}
                                   onConfirm={(ev) => {
                                       ev.preventDefault();
                                       this.handleDeleteAttribute();
                                   }}/>
                        </div>
                    ))}
                    { this.isCollapsible && this.state.collapsed
                      ? <span style={{color: "gray", fontWeight: "bold"}}>...</span>
                      : []
                    }
                </td>
            </tr>
        )
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        canDeleteAttributes: state.auth.loggedUser.capabilities.includes("removing_attributes"),
        router: state.router
    }
}

let ConnectedDefaultAttributeRenderer = connect(mapStateToProps)(DefaultAttributeRenderer);

class ObjectAttributes extends Component {
    state = {}

    static contextType = GlobalContext;

    updateAttributes = async () => {
        if (typeof this.props.object.id === 'undefined')
            return;
        try {
            let response = await api.getObjectMetakeys(this.props.object.id)
            let aggregated = response.data.metakeys.reduce(
                (agg, m) => {
                    let label = m.label || m.key;
                    return {
                        ...agg,
                        [label]: [m].concat(agg[label] || []) 
                    }
                }, {}
            )
            this.setState({
                attributes: aggregated
            });
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    }

    addAttribute = async (key, value) => {
        try {
            await api.addObjectMetakey(this.props.object.id, key, value)
            await this.updateAttributes();
            this.props.onRequestModalClose();
        } catch(error) {
            this.context.update({
                objectError: error,
            });
        }
    }

    componentDidMount() {
        this.updateAttributes();
    }

    componentDidUpdate(prevProps) {
        if (prevProps && prevProps.object.id !== this.props.object.id)
            this.updateAttributes();
    }

    render() {
        if(!this.state.attributes)
            return [];
        return (
            <Extendable ident="attributesList" 
                        attributes={this.state.attributes}
                        onUpdateAttributes={this.updateAttributes}
                        object={this.props.object}>
                {
                    Object.keys(this.state.attributes).length > 0
                    ? <DataTable>
                        {
                            Object.keys(this.state.attributes)
                                .sort()
                                .map(label => {
                                    let values = this.state.attributes[label];
                                    let key = (values[0] && values[0].key);
                                    let Attribute = attributeRenderers[key] || ConnectedDefaultAttributeRenderer;
                                    return <Attribute key={key} label={label} values={values}
                                                      object={this.props.object} onUpdateAttributes={this.updateAttributes}/>
                                })
                        }
                      </DataTable>
                    : <div className="card-body text-muted">No attributes to display</div>
                }
                <AttributesAddModal isOpen={this.props.isModalOpen}
                                    onRequestClose={this.props.onRequestModalClose}
                                    onAdd={this.addAttribute}/>
            </Extendable>
        )
    }
}

export default ObjectAttributes;
