import React, { useState, useRef } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useLocation } from "react-router-dom";

import {
    faCopy,
    faChevronUp,
    faChevronDown,
    faPlus,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import api from "@mwdb-web/commons/api";
import {
    ConfirmationModal,
    DateString,
    ShowIf,
    useViewAlert,
} from "@mwdb-web/commons/ui";

function KeyNameModal({ isOpen, onConfirm, onClose }) {
    const [currentKeyName, setCurrentKeyName] = useState("");
    const ref = useRef(null);

    function handleClose() {
        onClose();
        setCurrentKeyName("");
    }

    function handleConfirm() {
        onConfirm(currentKeyName);
        setCurrentKeyName("");
    }

    return (
        <ConfirmationModal
            isOpen={isOpen}
            onRequestClose={handleClose}
            buttonStyle="btn-primary"
            onConfirm={handleConfirm}
            onAfterOpen={() => ref.current.focus()}
            message={`Name the API key`}
            confirmText="Create"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleConfirm();
                }}
            >
                <input
                    ref={ref}
                    className="form-control"
                    type="text"
                    placeholder="API key name..."
                    onChange={(e) => setCurrentKeyName(e.target.value)}
                    value={currentKeyName}
                />
            </form>
        </ConfirmationModal>
    );
}

export default function ProfileAPIKeys({ profile, updateProfile }) {
    const location = useLocation();
    const viewAlert = useViewAlert();
    const [currentApiToken, setCurrentApiToken] = useState({});
    const [apiKeyToRemove, setApiKeyToRemove] = useState({});
    const [removeModalOpened, setRemoveModalOpened] = useState(false);
    const [apiKeyNameModalOpened, setApiKeyNameModalOpened] = useState(false);

    function closeKeyNameModal() {
        setApiKeyNameModalOpened(false);
    }

    async function getApiToken(apiKeyId) {
        try {
            setCurrentApiToken({
                id: apiKeyId,
            });
            const response = await api.apiKeyGetToken(apiKeyId);
            setCurrentApiToken(response.data);
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function createApiKey(name) {
        try {
            const response = await api.apiKeyAdd(profile.login, name);
            setCurrentApiToken(response.data);
            updateProfile();
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

    async function removeApiKey(apiKeyId) {
        try {
            await api.apiKeyRemove(apiKeyId);
            setCurrentApiToken({});
            setApiKeyToRemove({});
            updateProfile();
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

    if (Object.keys(profile).length === 0) return [];

    return (
        <div className="container">
            <h2>API keys</h2>
            <p className="lead">
                API keys are just an alternative to password-based
                authentication. They are recommended to use for scripts and
                other automation instead of plaintext passwords.
            </p>
            {!profile.api_keys.length ? (
                <p>
                    <i>
                        There are no API keys. Create the first one using
                        actions below.
                    </i>
                </p>
            ) : (
                []
            )}
            {profile.api_keys.map((apiKey) => (
                <div
                    key={apiKey.id}
                    className={`card ${
                        location.state && location.state.addedKey === apiKey.id
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
                            Issued on: <DateString date={apiKey.issued_on} />{" "}
                            {apiKey.issuer_login
                                ? `by ${apiKey.issuer_login}`
                                : []}
                        </p>
                        <a
                            href="#show-token"
                            className="card-link"
                            onClick={(ev) => {
                                ev.preventDefault();
                                if (currentApiToken.id !== apiKey.id)
                                    getApiToken(apiKey.id);
                                else setCurrentApiToken({});
                            }}
                        >
                            <FontAwesomeIcon
                                icon={
                                    currentApiToken.id === apiKey.id
                                        ? faChevronUp
                                        : faChevronDown
                                }
                            />{" "}
                            Show token
                        </a>
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
                                currentApiToken.token
                            }
                        >
                            <div className="card card-body border-primary">
                                <div
                                    className="text-monospace"
                                    style={{ margin: "8pt 0" }}
                                >
                                    {currentApiToken.token}
                                </div>
                                <CopyToClipboard text={currentApiToken.token}>
                                    <a
                                        href="#copy-token"
                                        className="card-link"
                                        onClick={(ev) => ev.preventDefault()}
                                    >
                                        <FontAwesomeIcon icon={faCopy} /> Copy
                                        to clipboard
                                    </a>
                                </CopyToClipboard>
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
                onConfirm={(e) => removeApiKey(apiKeyToRemove.id)}
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
