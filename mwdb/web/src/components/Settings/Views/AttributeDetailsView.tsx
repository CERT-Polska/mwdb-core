import React, { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "@mwdb-web/commons/api";
import {
    ConfirmationModal,
    EditableItem,
    PseudoEditableItem,
    FeatureSwitch,
} from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";

import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DetailsRecord } from "../common/DetailsRecord";
import { AttributeOutletContext } from "@mwdb-web/types/context";
import { AttributeDefinition } from "@mwdb-web/types/types";

export function AttributeDetailsView() {
    const viewAlert = useViewAlert();
    const { attribute, getAttribute }: AttributeOutletContext =
        useOutletContext();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] =
        useState<boolean>(false);

    async function handleSubmit(newValue: Partial<AttributeDefinition>) {
        try {
            await api.updateAttributeDefinition({
                key: attribute.key,
                label: newValue.label,
                description: newValue.description,
                url_template: newValue.url_template,
                hidden: newValue.hidden,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        } finally {
            getAttribute();
        }
    }

    async function handleRemoveAttribute() {
        try {
            setDeleteModalDisabled(true);
            await api.removeAttributeDefinition(attribute.key);
            viewAlert.redirectToAlert({
                target: "/settings/attributes",
                success: `Attribute '${attribute.key}' successfully removed.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <DetailsRecord label="Label">
                        <EditableItem
                            name="label"
                            defaultValue={attribute.label}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Description">
                        <EditableItem
                            name="description"
                            defaultValue={attribute.description}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord
                        label={<React.Fragment>URL template</React.Fragment>}
                    >
                        <EditableItem
                            name="url_template"
                            defaultValue={attribute.url_template}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Rich template">
                        <PseudoEditableItem
                            editLocation={`/settings/attribute/${attribute.key}/edit-template`}
                        >
                            <pre
                                style={{
                                    float: "left",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                }}
                            >
                                {attribute.rich_template}
                            </pre>
                        </PseudoEditableItem>
                    </DetailsRecord>
                </tbody>
            </table>
            <b>Attribute features:</b>
            <FeatureSwitch
                name="hidden"
                value={attribute["hidden"]}
                onUpdate={handleSubmit}
            >
                <b>Hidden attribute</b>
                {attribute["hidden"] ? (
                    <span className="badge badge-success">Enabled</span>
                ) : (
                    <></>
                )}
                <div>
                    Hidden attributes have protected values. Attribute values
                    are not visible for users without reading_all_attributes
                    capability and explicit request for reading them. Also only
                    exact search is allowed. User still must have permission to
                    read key to use it in query.
                </div>
            </FeatureSwitch>
            <b>Actions:</b>
            <ul className="nav">
                <li className="nav-item">
                    <Link
                        className="nav-link"
                        to={`/settings/attribute/${attribute.key}/permissions`}
                    >
                        Edit attribute permissions
                    </Link>
                    <a
                        href="#remove-user"
                        className="nav-link text-danger"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setDeleteModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        Remove attribute
                    </a>
                </li>
            </ul>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                disabled={isDeleteModalDisabled}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={handleRemoveAttribute}
                message={`Are you sure you want to delete ${attribute.key} attribute`}
                buttonStyle="btn-danger"
            />
        </div>
    );
}
