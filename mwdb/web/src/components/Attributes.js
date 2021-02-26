import React, { useContext, useState, useCallback, useEffect } from "react";
import AttributesAddModal from "./AttributesAddModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { APIContext } from "@mwdb-web/commons/api/context";
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
    const api = useContext(APIContext);
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

function ObjectAttributes(props) {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);

    const [attributes, setAttributes] = useState([]);

    async function updateAttributes() {
        if (typeof context.object.id === "undefined") return;
        try {
            let response = await api.getObjectMetakeys(context.object.id);
            let aggregated = response.data.metakeys.reduce((agg, m) => {
                let label = m.label || m.key;
                return {
                    ...agg,
                    [label]: [m].concat(agg[label] || []),
                };
            }, {});
            setAttributes(aggregated);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    async function addAttribute(key, value) {
        try {
            await api.addObjectMetakey(context.object.id, key, value);
            await updateAttributes();
            props.onRequestModalClose();
        } catch (error) {
            context.setObjectError(error);
        }
    }

    const getAttributes = useCallback(updateAttributes, [context.object.id]);

    useEffect(() => {
        getAttributes();
    }, [getAttributes]);

    if (!attributes) return [];

    return (
        <Extendable
            ident="attributesList"
            attributes={attributes}
            onUpdateAttributes={updateAttributes}
            object={context.object}
        >
            {Object.keys(attributes).length > 0 ? (
                <DataTable>
                    {Object.keys(attributes)
                        .sort()
                        .map((label) => {
                            let values = attributes[label];
                            let key = values[0] && values[0].key;
                            let Attribute =
                                attributeRenderers[key] ||
                                DefaultAttributeRenderer;
                            return (
                                <Attribute
                                    key={key}
                                    label={label}
                                    values={values}
                                    object={context.object}
                                    onUpdateAttributes={updateAttributes}
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
                isOpen={props.isModalOpen}
                onRequestClose={props.onRequestModalClose}
                onAdd={addAttribute}
            />
        </Extendable>
    );
}

export default ObjectAttributes;
