import React, { useState, useEffect, useCallback } from "react";
import api from "@mwdb-web/commons/api";
import {
    ConfirmationModal,
    EditableItem,
    useViewAlert,
} from "@mwdb-web/commons/ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "react-router-dom";

function ProviderItem(props) {
    let value = props.value ? props.value : "never";
    return (
        <tr className="d-flex">
            <th className="col-3">{props.label}</th>
            <td className="col-9">{props.children || value}</td>
        </tr>
    );
}

export default function OAuthProvider() {
    const viewAlert = useViewAlert();
    const { name } = useParams();
    const [provider, setProvider] = useState({});
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] = useState(false);

    async function updateProvider() {
        try {
            const response = await api.oauthGetSingleProvider(name);
            setProvider(response.data);
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function handleSubmit(newValue) {
        try {
            await api.oauthUpdateSingleProvider(provider.name, newValue);
            viewAlert.setAlert({
                success: `Provider successfully updated`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        } finally {
            updateProvider();
        }
    }

    async function handleRemoveProvider() {
        try {
            setDeleteModalDisabled(true);
            await api.oauthRemoveSingleProvider(provider.name);
            viewAlert.redirectToAlert({
                target: "/settings/oauth",
                success: `Provider '${provider.name}' successfully removed.`,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
            setDeleteModalDisabled(false);
        }
    }

    const getProvider = useCallback(updateProvider, [name, viewAlert]);

    useEffect(() => {
        getProvider();
    }, [getProvider]);

    if (!provider) return [];

    return (
        <div className="container">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <strong>Provider details: </strong>
                        <span>{provider.name}</span>
                    </li>
                </ol>
            </nav>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <ProviderItem label="Client ID">
                        <EditableItem
                            name="client_id"
                            type="client_id"
                            defaultValue={provider.client_id}
                            onSubmit={handleSubmit}
                        />
                    </ProviderItem>
                    <ProviderItem label="Client secret">
                        <EditableItem
                            name="client_secret"
                            type="client_secret"
                            defaultValue={provider.client_secret}
                            onSubmit={handleSubmit}
                            masked
                        />
                    </ProviderItem>
                    <ProviderItem label="Authorization endpoint">
                        <EditableItem
                            name="authorization_endpoint"
                            type="authorization_endpoint"
                            defaultValue={provider.authorization_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </ProviderItem>
                    <ProviderItem label="Token endpoint">
                        <EditableItem
                            name="token_endpoint"
                            type="token_endpoint"
                            defaultValue={provider.token_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </ProviderItem>
                    <ProviderItem label="Userinfo endpoint">
                        <EditableItem
                            name="userinfo_endpoint"
                            type="userinfo_endpoint"
                            defaultValue={provider.userinfo_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </ProviderItem>
                    <ProviderItem label="JWKS endpoint">
                        <EditableItem
                            name="jwks_endpoint"
                            type="jwks_endpoint"
                            defaultValue={provider.jwks_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </ProviderItem>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav">
                <li className="nav-item">
                    <a
                        href="#remove-user"
                        className="nav-link text-danger"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setDeleteModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon="trash" />
                        Remove provider
                    </a>
                </li>
            </ul>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                disabled={isDeleteModalDisabled}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={handleRemoveProvider}
                message={`Are you sure you want to remove ${provider.name} provider from MWDB`}
                buttonStyle="btn-danger"
            />
        </div>
    );
}
