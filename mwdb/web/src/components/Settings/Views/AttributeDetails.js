import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "@mwdb-web/commons/api";
import {
    ConfirmationModal,
    EditableItem,
    FeatureSwitch,
    useViewAlert,
} from "@mwdb-web/commons/ui";

import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function AttributeItem(props) {
    let value = props.value ? props.value : "never";
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || value}</td>
        </tr>
    );
}

export function AttributeDetails({ attribute, getAttribute }) {
    const viewAlert = useViewAlert();
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] = useState(false);

    async function handleSubmit(newValue) {
        if (newValue.hidden === "Enabled") {
            newValue.hidden = true;
        } else if (newValue.hidden === "Disabled") {
            newValue.hidden = false;
        }
        try {
            await api.updateAttributeDefinition(
                attribute.key,
                newValue.label,
                newValue.description,
                newValue["url_template"],
                newValue.hidden
            );
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
                    <AttributeItem label="Label">
                        <EditableItem
                            name="label"
                            defaultValue={attribute.label}
                            onSubmit={handleSubmit}
                        />
                    </AttributeItem>
                    <AttributeItem label="Description">
                        <EditableItem
                            name="description"
                            defaultValue={attribute.description}
                            onSubmit={handleSubmit}
                        />
                    </AttributeItem>
                    <AttributeItem label="URL Template">
                        <EditableItem
                            name="url_template"
                            defaultValue={attribute["url_template"]}
                            onSubmit={handleSubmit}
                        />
                    </AttributeItem>
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
                    []
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
