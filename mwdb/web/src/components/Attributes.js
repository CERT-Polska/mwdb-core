import React, { Component, useContext, useState } from "react";
import AttributesAddModal from "./AttributesAddModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";
import {
    DataTable,
    ConfirmationModal,
    ActionCopyToClipboard,
} from "@mwdb-web/commons/ui";

let attributeRenderers = {};

for (let extraRenderers of fromPlugin("attributeRenderers")) {
    attributeRenderers = { ...attributeRenderers, ...extraRenderers };
}

function DefaultAttributeRenderer(props) {
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    const [collapsed, setCollapsed] = useState(true);
    const [isOpenDeleteModal, setOpenDeleteModal] = useState(false);
    const [attributeToRemove, setAttributeToRemote] = useState(null);

    const isCollapsible = props.values.length > 3;

    async function deleteAttribute() {
        try {
            await api.removeObjectMetakey(
                context.object.type,
                context.object.id,
                attributeToRemove.key,
                attributeToRemove.value
            );
            props.onUpdateAttributes();
            setOpenDeleteModal(false);
            setAttributeToRemote(null);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    const visibleValues = collapsed ? props.values.slice(0, 3) : props.values;

    return (
        <tr key={props.label}>
            <th
                onClick={(ev) => {
                    ev.preventDefault();
                    setCollapsed(!collapsed);
                }}
            >
                {isCollapsible ? (
                    <FontAwesomeIcon
                        icon={collapsed ? "plus" : "minus"}
                        size="sm"
                    />
                ) : (
                    []
                )}{" "}
                {props.label}
            </th>
            <td className="flickerable">
                {visibleValues.map((attr) => (
                    <div key={attr.value}>
                        {attr.url ? (
                            <a href={attr.url}>{attr.value}</a>
                        ) : (
                            <span>{attr.value}</span>
                        )}
                        <span className="ml-2">
                            <ActionCopyToClipboard
                                text={attr.value}
                                tooltipMessage="Copy value to clipboard"
                            />
                        </span>
                        {auth.hasCapability("removing_attributes") && (
                            <span
                                className="ml-2"
                                data-toggle="tooltip"
                                title="Remove attribute value from this object."
                                onClick={() => {
                                    setAttributeToRemote({
                                        key: attr.key,
                                        value: attr.value,
                                    });
                                    setOpenDeleteModal(true);
                                }}
                            >
                                <i>
                                    <FontAwesomeIcon
                                        icon={"trash"}
                                        size="sm"
                                        style={{ cursor: "pointer" }}
                                    />
                                </i>
                            </span>
                        )}
                        <ConfirmationModal
                            buttonStyle="btn-danger"
                            confirmText="Yes"
                            cancelText="No"
                            message="Are you sure you want to remove this attribute from the object?"
                            isOpen={isOpenDeleteModal}
                            onRequestClose={() => setOpenDeleteModal(false)}
                            onConfirm={(ev) => {
                                ev.preventDefault();
                                deleteAttribute();
                            }}
                        />
                    </div>
                ))}
                {isCollapsible && collapsed ? (
                    <span style={{ color: "gray", fontWeight: "bold" }}>
                        ...
                    </span>
                ) : (
                    []
                )}
            </td>
        </tr>
    );
}

class ObjectAttributes extends Component {
    state = {};

    static contextType = ObjectContext;

    updateAttributes = async () => {
        if (typeof this.props.object.id === "undefined") return;
        try {
            let response = await api.getObjectMetakeys(this.props.object.id);
            let aggregated = response.data.metakeys.reduce((agg, m) => {
                let label = m.label || m.key;
                return {
                    ...agg,
                    [label]: [m].concat(agg[label] || []),
                };
            }, {});
            this.setState({
                attributes: aggregated,
            });
        } catch (error) {
            this.context.setObjectError(error);
        }
    };

    addAttribute = async (key, value) => {
        try {
            await api.addObjectMetakey(this.props.object.id, key, value);
            await this.updateAttributes();
            this.props.onRequestModalClose();
        } catch (error) {
            this.context.setObjectError(error);
        }
    };

    componentDidMount() {
        this.updateAttributes();
    }

    componentDidUpdate(prevProps) {
        if (prevProps && prevProps.object.id !== this.props.object.id)
            this.updateAttributes();
    }

    render() {
        if (!this.state.attributes) return [];
        return (
            <Extendable
                ident="attributesList"
                attributes={this.state.attributes}
                onUpdateAttributes={this.updateAttributes}
                object={this.props.object}
            >
                {Object.keys(this.state.attributes).length > 0 ? (
                    <DataTable>
                        {Object.keys(this.state.attributes)
                            .sort()
                            .map((label) => {
                                let values = this.state.attributes[label];
                                let key = values[0] && values[0].key;
                                let Attribute =
                                    attributeRenderers[key] ||
                                    DefaultAttributeRenderer;
                                return (
                                    <Attribute
                                        key={key}
                                        label={label}
                                        values={values}
                                        object={this.props.object}
                                        onUpdateAttributes={
                                            this.updateAttributes
                                        }
                                    />
                                );
                            })}
                    </DataTable>
                ) : (
                    <div className="card-body text-muted">
                        No attributes to display
                    </div>
                )}
                <AttributesAddModal
                    isOpen={this.props.isModalOpen}
                    onRequestClose={this.props.onRequestModalClose}
                    onAdd={this.addAttribute}
                />
            </Extendable>
        );
    }
}

export default ObjectAttributes;
