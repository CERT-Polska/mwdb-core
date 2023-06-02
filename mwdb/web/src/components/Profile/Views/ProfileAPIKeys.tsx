import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useLocation, useOutletContext } from "react-router-dom";

import { faCopy, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { api } from "@mwdb-web/commons/api";
import { ConfirmationModal, DateString, ShowIf } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { KeyNameModal } from "../common/KeyNameModal";
import { ApiKey, Capability, User } from "@mwdb-web/types/types";

type OutletContext = {
    getUser: () => Promise<void>;
    setCapabilitiesToDelete: (cap: Capability) => void;
    profile: User;
};

type Props = {
    profile?: User;
    getProfile?: () => Promise<void>;
};

export function ProfileAPIKeys({ profile, getProfile }: Props) {
    const location = useLocation();
    const viewAlert = useViewAlert();
    const outletContext: OutletContext = useOutletContext();
    const [currentApiToken, setCurrentApiToken] = useState<Partial<ApiKey>>({});
    const [apiKeyToRemove, setApiKeyToRemove] = useState<Partial<ApiKey>>({});
    const [removeModalOpened, setRemoveModalOpened] = useState<boolean>(false);
    const [apiKeyNameModalOpened, setApiKeyNameModalOpened] =
        useState<boolean>(false);

    // Component is reused by Settings
    if (profile === undefined) {
        profile = outletContext.profile;
        getProfile = outletContext.getUser;
    }

    function closeKeyNameModal() {
        setApiKeyNameModalOpened(false);
    }

    async function createApiKey(name: string) {
        try {
            const response = await api.apiKeyAdd(profile!.login, name);
            setCurrentApiToken(response.data);
            if (getProfile) {
                getProfile();
            }
            viewAlert.setAlert({
                success: "New API key successfully added",
                state: {
                    addedKey: response.data.id,
                },
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function removeApiKey(apiKeyId: string) {
        try {
            await api.apiKeyRemove(apiKeyId);
            setCurrentApiToken({});
            setApiKeyToRemove({});
            if (getProfile) {
                getProfile();
            }
            setRemoveModalOpened(false);
            viewAlert.setAlert({
                success: "API key successfully removed",
                state: {
                    addedKey: null,
                },
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    if (Object.keys(profile).length === 0) return <></>;

    return (
        <div className="container">
            <h2>API keys</h2>
            <p className="lead">
                API keys are just an alternative to password-based
                authentication. They are recommended to use for scripts and
                other automation instead of plaintext passwords.
            </p>
            {profile.api_keys && !profile.api_keys.length && (
                <p>
                    <i>
                        There are no API keys. Create the first one using
                        actions below.
                    </i>
                </p>
            )}
            {profile.api_keys &&
                profile.api_keys.map((apiKey: ApiKey) => (
                    <div
                        key={apiKey.id}
                        className={`card ${
                            location.state &&
                            location.state.addedKey === apiKey.id
                                ? "border-success"
                                : ""
                        }`}
                    >
                        <div className="card-body">
                            <h5 className="card-subtitle text-muted">
                                <span className="text-monospace">
                                    {apiKey.name || apiKey.id}
                                </span>
                            </h5>
                            <p className="card-text">
                                Issued on:{" "}
                                <DateString date={apiKey.issued_on} />{" "}
                                {apiKey.issuer_login
                                    ? `by ${apiKey.issuer_login}`
                                    : []}
                            </p>
                            <a
                                href="#remove-key"
                                className="card-link text-danger"
                                onClick={(ev) => {
                                    ev.preventDefault();
                                    setApiKeyToRemove(apiKey);
                                    setRemoveModalOpened(true);
                                }}
                            >
                                <FontAwesomeIcon icon={faTrash} /> Remove key
                            </a>
                            <ShowIf
                                condition={
                                    currentApiToken.id === apiKey.id &&
                                    !!currentApiToken.token
                                }
                            >
                                <div className="card card-body border-primary">
                                    <div
                                        className="text-monospace"
                                        style={{ margin: "8pt 0" }}
                                    >
                                        <b>
                                            Api key token will be shown only
                                            once, copy its value because it will
                                            not be visible again.
                                        </b>
                                    </div>
                                    <div
                                        className="text-monospace"
                                        style={{ margin: "8pt 0" }}
                                    >
                                        {currentApiToken.token}
                                    </div>
                                    {currentApiToken.token && (
                                        <CopyToClipboard
                                            text={currentApiToken.token}
                                        >
                                            <a
                                                href="#copy-token"
                                                className="card-link"
                                                onClick={(ev) =>
                                                    ev.preventDefault()
                                                }
                                            >
                                                <FontAwesomeIcon
                                                    icon={faCopy}
                                                />{" "}
                                                Copy to clipboard
                                            </a>
                                        </CopyToClipboard>
                                    )}
                                </div>
                            </ShowIf>
                        </div>
                    </div>
                ))}
            <b>Actions:</b>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <a
                        href="#new-api-key"
                        className="nav-link"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setApiKeyNameModalOpened(true);
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} /> Issue new API key
                    </a>
                </li>
            </ul>
            <ConfirmationModal
                isOpen={removeModalOpened}
                onRequestClose={() => setRemoveModalOpened(false)}
                onConfirm={(e) =>
                    apiKeyToRemove.id && removeApiKey(apiKeyToRemove.id)
                }
                message={`Remove the API key ${apiKeyToRemove.name}?`}
                confirmText="Remove"
            />
            <KeyNameModal
                isOpen={apiKeyNameModalOpened}
                onClose={closeKeyNameModal}
                onConfirm={(keyName) => {
                    closeKeyNameModal();
                    createApiKey(keyName);
                }}
            />
        </div>
    );
}
