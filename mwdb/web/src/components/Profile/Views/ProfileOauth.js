import React, { useContext, useEffect, useState } from "react";

import { APIContext } from "@mwdb-web/commons/api/context";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ConfirmationModal, useViewAlert } from "@mwdb-web/commons/ui";

export function ProfileOauth() {
    const api = useContext(APIContext);
    const viewAlert = useViewAlert();
    const [providers, setProviders] = useState([]);
    const [chosenProvider, setChosenProvider] = useState();
    const [addModalOpen, setAddModalOpen] = useState(false);

    async function getProviders() {
        try {
            const response = await api.axios.get("/oauth");
            setProviders(response.data["providers"]);
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function bindProvider(provider) {
        try {
            const response = await api.axios.post(
                `/oauth/${provider}/authenticate`
            );
            let expirationTime = new Date();
            expirationTime.setTime(expirationTime.getTime() + 5 * 60 * 1000);
            sessionStorage.setItem(
                `openid_${response.data["state"]}`,
                JSON.stringify({
                    provider: provider,
                    nonce: response.data["nonce"],
                    action: "bind_account",
                    expiration: expirationTime,
                })
            );
            window.location = response.data["authorization_url"];
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    useEffect(() => {
        getProviders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="container">
            <h2>OpenID Connect authorization</h2>
            <p className="lead">
                OpenID Connect is an alternative form of password-based
                authentication. They are recommended to use for scripts and
                other automation instead of plaintext passwords. You can link
                your account with an external identity provider to use it for
                authorization on the website in the future.
            </p>
            <b>Actions:</b>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <a
                        href="#new-api-key"
                        className="nav-link"
                        onClick={(ev) => {
                            ev.preventDefault();
                            setAddModalOpen(true);
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} /> Connect with external
                        identity
                    </a>
                </li>
            </ul>

            <ConfirmationModal
                isOpen={addModalOpen}
                onRequestClose={() => setAddModalOpen(false)}
                message="Choose OpenID Provider to connect"
                onConfirm={(e) => {
                    e.preventDefault();
                    bindProvider(chosenProvider);
                }}
                buttonStyle="btn-info"
                confirmText="Bind"
            >
                <form onSubmit={(e) => {}}>
                    <div>
                        <select
                            className="custom-select"
                            value={chosenProvider}
                            onChange={(ev) =>
                                setChosenProvider(ev.target.value)
                            }
                        >
                            <option value="" hidden>
                                Select provider...
                            </option>
                            {providers.map((provider) => (
                                <option value={provider}>{provider}</option>
                            ))}
                        </select>
                    </div>
                </form>
            </ConfirmationModal>
        </div>
    );
}
