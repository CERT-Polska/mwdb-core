import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "@mwdb-web/commons/api";
import {
    ConfirmationModal,
    EditableItem,
    useViewAlert,
} from "@mwdb-web/commons/ui";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
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
    const auth = useContext(AuthContext);
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
            await api.updateMetakeyDefinition(attribute.key, newValue);
        } catch (error) {
            viewAlert.setAlert({ error });
        } finally {
            getAttribute();
        }
    }

    async function handleRemoveAttribute() {
        try {
            setDeleteModalDisabled(true);
            await api.removeMetakeyDefinition(attribute.key);
            viewAlert.redirectToAlert({
                target: "/admin/attributes",
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
                            name="template"
                            defaultValue={attribute.template}
                            onSubmit={handleSubmit}
                        />
                    </AttributeItem>
                    <AttributeItem label="Hidden">
                        <EditableItem
                            name="hidden"
                            defaultValue={
                                attribute.hidden ? "Enabled" : "Disabled"
                            }
                            onSubmit={handleSubmit}
                            badge
                            selective
                        >
                            <option value="Enabled">Enabled</option>
                            <option value="Disabled">Disabled</option>
                        </EditableItem>
                    </AttributeItem>
                    <tr className="d-flex">
                        <div className="form-hint">
                            Hidden attributes have protected values. Attribute
                            values are not visible for users without
                            reading_all_attributes capability and explicit
                            request for reading them. Also only exact search is
                            allowed. User still must have permission to read key
                            to use it in query.
                        </div>
                    </tr>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav">
                <li className="nav-item">
                    {auth.hasCapability(Capability.manageUsers) && (
                        <Link
                            className="nav-link"
                            to={`/admin/attribute/${attribute.key}/permissions`}
                        >
                            Edit attribute permissions
                        </Link>
                    )}
                    <a
                        href="#remove-user"
                        className="nav-link text-danger"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setDeleteModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon="trash" />
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
