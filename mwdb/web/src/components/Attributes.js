import React, { useContext, useState, useCallback, useEffect } from "react";
import AttributesAddModal from "./AttributesAddModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { fromPlugin, Extendable } from "@mwdb-web/commons/extensions";
import {
    DataTable,
    ConfirmationModal,
    ActionCopyToClipboard,
} from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { useHistory } from "react-router-dom";

let attributeRenderers = {};

for (let extraRenderers of fromPlugin("attributeRenderers")) {
    attributeRenderers = { ...attributeRenderers, ...extraRenderers };
}

function AttributeRenderer({
    attributeKey,
    attributeDefinition,
    values,
    onUpdateAttributes,
}) {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const history = useHistory();

    const [collapsed, setCollapsed] = useState(true);
    const [isOpenDeleteModal, setOpenDeleteModal] = useState(false);
    const [attributeIdToRemove, setAttributeIdToRemove] = useState(null);

    const isCollapsible = values.length > 3;

    async function deleteAttribute() {
        try {
            await api.removeObjectAttribute(
                context.object.id,
                attributeIdToRemove
            );
            onUpdateAttributes();
            setOpenDeleteModal(false);
            setAttributeIdToRemove(null);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    const visibleValues = collapsed ? values.slice(0, 3) : values;
    const attributeLabel = attributeDefinition.label || attributeKey;

    const attributeValues = visibleValues.map((attribute) => {
        let valueRender, valueRaw;
        if (typeof attribute.value === "string") {
            // URL templates are supported only for string values
            const url = attributeDefinition["url_template"]
                ? attributeDefinition["url_template"].replace(
                      "$value",
                      attribute.value
                  )
                : null;
            if (url) {
                valueRender = <a href={url}>{attribute.value}</a>;
            } else {
                valueRender = <span>{attribute.value}</span>;
            }
            valueRaw = attribute.value;
        } else {
            valueRender = (
                <pre className="attribute-object">
                    {"(object)"} {JSON.stringify(attribute.value, null, 4)}
                </pre>
            );
            valueRaw = JSON.stringify(attribute.value);
        }
        return (
            <div key={attribute.id} className="d-flex">
                {valueRender}
                <div className="d-flex align-items-center">
                    <span className="ml-2">
                        <ActionCopyToClipboard
                            text={valueRaw}
                            tooltipMessage="Copy value to clipboard"
                        />
                    </span>
                    {typeof attribute.value === "string" ? (
                        <span
                            className="ml-2"
                            data-toggle="tooltip"
                            title="Search for that attribute values"
                            onClick={(ev) => {
                                ev.preventDefault();
                                history.push(
                                    makeSearchLink(
                                        `attribute.${attributeKey}`,
                                        valueRaw,
                                        false
                                    )
                                );
                            }}
                        >
                            <i>
                                <FontAwesomeIcon
                                    icon="search"
                                    size="sm"
                                    style={{ cursor: "pointer" }}
                                />
                            </i>
                        </span>
                    ) : (
                        []
                    )}
                    {auth.hasCapability(Capability.removingAttributes) && (
                        <span
                            className="ml-2"
                            data-toggle="tooltip"
                            title="Remove attribute value from this object"
                            onClick={() => {
                                setAttributeIdToRemove(attribute.id);
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
                </div>
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
        );
    });
    return (
        <tr key={attributeKey}>
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
                <span
                    data-toggle="tooltip"
                    title={attributeKey}
                    style={{ cursor: "pointer" }}
                >
                    {attributeLabel}
                </span>
            </th>
            <td className="flickerable">
                {attributeValues}
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

    const [attributeDefinitions, setAttributeDefinitions] = useState({});
    const [attributes, setAttributes] = useState([]);
    const objectId = context.object.id;
    const setObjectError = context.setObjectError;

    async function updateAttributeDefinitions() {
        try {
            const response = await api.getAttributeDefinitions("read");
            const keyDefinitions = response.data[
                "attribute_definitions"
            ].reduce(
                (agg, definition) => ({
                    ...agg,
                    [definition.key]: definition,
                }),
                {}
            );
            setAttributeDefinitions(keyDefinitions);
        } catch (error) {
            setObjectError(error);
        }
    }

    async function updateAttributes() {
        if (typeof objectId === "undefined") return;
        try {
            const response = await api.getObjectAttributes(objectId);
            const attributes = response.data.attributes.reduce(
                (agg, attribute) => ({
                    ...agg,
                    [attribute.key]: [
                        {
                            id: attribute.id,
                            value: attribute.value,
                        },
                    ].concat(agg[attribute.key] || []),
                }),
                {}
            );
            setAttributes(attributes);
        } catch (error) {
            setObjectError(error);
        }
    }

    async function addAttribute(key, value) {
        try {
            await api.addObjectAttribute(objectId, key, value);
            await updateAttributes();
            props.onRequestModalClose();
        } catch (error) {
            setObjectError(error);
        }
    }

    const getAttributeDefinitions = useCallback(updateAttributeDefinitions, [
        api,
        setObjectError,
    ]);

    useEffect(() => {
        getAttributeDefinitions();
    }, [getAttributeDefinitions]);

    const getAttributes = useCallback(updateAttributes, [
        objectId,
        api,
        setObjectError,
    ]);

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
                        .map((key) => {
                            const definition = attributeDefinitions[key];
                            if (!definition)
                                // definition not yet loaded
                                return [];
                            const values = attributes[key];
                            let Attribute =
                                attributeRenderers[key] || AttributeRenderer;
                            return (
                                <Attribute
                                    key={key}
                                    attributeKey={key}
                                    attributeDefinition={definition}
                                    values={values}
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
