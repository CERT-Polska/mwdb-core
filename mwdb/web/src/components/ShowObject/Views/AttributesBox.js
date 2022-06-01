import React, { useContext, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Extendable } from "@mwdb-web/commons/extensions";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

import Attributes from "./Attributes";
import AttributesAddModal from "../../AttributesAddModal";

export default function AttributesBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    const [isAttributeAddModalOpen, setAttributeAddModalOpen] = useState(false);
    // If null then remove modal is closed
    const [attributeIdToRemove, setAttributeIdToRemove] = useState(null);

    const [attributeDefinitions, setAttributeDefinitions] = useState(null);
    const [attributes, setAttributes] = useState(null);
    const objectId = context.object.id;
    const setObjectError = context.setObjectError;
    const dataLoaded = attributeDefinitions !== null && attributes !== null;

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
            setAttributeAddModalOpen(false);
        } catch (error) {
            setObjectError(error);
        }
    }

    async function deleteAttribute() {
        try {
            await api.removeObjectAttribute(objectId, attributeIdToRemove);
            await updateAttributes();
            setAttributeIdToRemove(null);
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

    return (
        <Extendable ident="attributesBox">
            <div className="card card-default">
                <div className="card-header">
                    Attributes
                    {!api.remote ? (
                        <Link
                            to="#"
                            className="float-right"
                            onClick={(ev) => {
                                ev.preventDefault();
                                setAttributeAddModalOpen(true);
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faPlus}
                                pull="left"
                                size="1x"
                            />
                            Add
                        </Link>
                    ) : (
                        []
                    )}
                </div>
                {!dataLoaded ? (
                    <div className="card-body text-muted">Loading data...</div>
                ) : (
                    <Attributes
                        attributes={attributes}
                        attributeDefinitions={attributeDefinitions}
                        onUpdateAttributes={getAttributes}
                        onRemoveAttribute={
                            auth.hasCapability(Capability.removingAttributes) &&
                            ((attributeId) =>
                                setAttributeIdToRemove(attributeId))
                        }
                    />
                )}
            </div>
            <AttributesAddModal
                isOpen={isAttributeAddModalOpen}
                onRequestClose={() => setAttributeAddModalOpen(false)}
                onAdd={addAttribute}
            />
            <ConfirmationModal
                buttonStyle="btn-danger"
                confirmText="Yes"
                cancelText="No"
                message="Are you sure you want to remove this attribute from the object?"
                isOpen={attributeIdToRemove !== null}
                onRequestClose={() => setAttributeIdToRemove(null)}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    deleteAttribute();
                }}
            />
        </Extendable>
    );
}
