import { useState, useEffect } from "react";
import { isEmpty } from "lodash";
import { api } from "@mwdb-web/commons/api";
import { ConfirmationModal, EditableItem } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";
import { DetailsRecord } from "../common/DetailsRecord";
import { Provider } from "@mwdb-web/types/types";

export function OAuthProviderView() {
    const viewAlert = useViewAlert();
    const { name } = useParams();
    const [provider, setProvider] = useState<Provider>({} as Provider);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleteModalDisabled, setDeleteModalDisabled] = useState(false);

    async function updateProvider() {
        try {
            const response = await api.oauthGetSingleProvider(name ?? "");
            setProvider(response.data);
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function handleSubmit(newValue: Partial<Provider>) {
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

    useEffect(() => {
        updateProvider();
    }, [name]);

    if (isEmpty(provider)) return <></>;

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
                    <DetailsRecord label="Client ID">
                        <EditableItem
                            name="client_id"
                            type="client_id"
                            defaultValue={provider.client_id}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Client secret">
                        <EditableItem
                            name="client_secret"
                            type="client_secret"
                            defaultValue={provider.client_secret || ""}
                            onSubmit={handleSubmit}
                            masked
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Authorization endpoint">
                        <EditableItem
                            name="authorization_endpoint"
                            type="authorization_endpoint"
                            defaultValue={provider.authorization_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Token endpoint">
                        <EditableItem
                            name="token_endpoint"
                            type="token_endpoint"
                            defaultValue={provider.token_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Userinfo endpoint">
                        <EditableItem
                            name="userinfo_endpoint"
                            type="userinfo_endpoint"
                            defaultValue={provider.userinfo_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="JWKS endpoint">
                        <EditableItem
                            name="jwks_endpoint"
                            type="jwks_endpoint"
                            defaultValue={provider.jwks_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
                    <DetailsRecord label="Logout endpoint">
                        <EditableItem
                            name="logout_endpoint"
                            type="logout_endpoint"
                            defaultValue={provider.logout_endpoint}
                            onSubmit={handleSubmit}
                        />
                    </DetailsRecord>
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
                        <FontAwesomeIcon icon={faTrash} />
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
