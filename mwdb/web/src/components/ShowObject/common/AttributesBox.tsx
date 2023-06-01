import { useContext, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Extendable } from "@mwdb-web/commons/plugins";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { Capability } from "@mwdb-web/types/types";

import { Attributes } from "./Attributes";
import { AttributesAddModal } from "../../AttributesAddModal";
import { Attribute, AttributeDefinition } from "@mwdb-web/types/types";

export function AttributesBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    const [isAttributeAddModalOpen, setAttributeAddModalOpen] =
        useState<boolean>(false);
    // If null then remove modal is closed
    const [attributeIdToRemove, setAttributeIdToRemove] = useState<
        number | null
    >(null);

    const [attributeDefinitions, setAttributeDefinitions] = useState<Record<
        string,
        AttributeDefinition
    > | null>(null);
    const objectId = context.object!.id!;
    const { setObjectError, updateObjectData } = context;
    const attributes = context.object!.attributes ?? [];
    const dataLoaded = attributeDefinitions && attributes;

    async function updateAttributeDefinitions() {
        try {
            const response = await api.getAttributeDefinitions("read");
            const keyDefinitions = response.data.attribute_definitions.reduce(
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
        try {
            const response = await api.getObjectAttributes(objectId);
            const attributes = response.data.attributes;
            updateObjectData({ attributes });
        } catch (error) {
            setObjectError(error);
        }
    }

    async function addAttribute(key: string, value: string) {
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
            if (attributeIdToRemove) {
                await api.removeObjectAttribute(objectId, attributeIdToRemove);
                await updateAttributes();
                setAttributeIdToRemove(null);
            }
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
        updateObjectData,
    ]);

    const aggregatedAttributes: Record<string, Attribute[]> = attributes.reduce(
        (agg, attribute) => {
            const key = attribute.key;
            const newAttribute: Attribute = {
                key,
                id: attribute.id,
                value: attribute.value,
            };
            return {
                ...agg,
                [key]: [newAttribute, ...(agg[key] || [])],
            };
        },
        {} as Record<string, Attribute[]>
    );

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
                        attributes={aggregatedAttributes}
                        attributeDefinitions={attributeDefinitions}
                        onUpdateAttributes={getAttributes}
                        onRemoveAttribute={
                            auth.hasCapability(Capability.removingAttributes)
                                ? (attributeId) =>
                                      setAttributeIdToRemove(attributeId)
                                : () => {}
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
