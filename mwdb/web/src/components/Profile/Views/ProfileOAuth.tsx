import { useEffect, useState } from "react";

import { api } from "@mwdb-web/commons/api";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ConfirmationModal, ShowIf } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";

export function ProfileOAuth() {
    const viewAlert = useViewAlert();
    const [providers, setProviders] = useState<string[]>([]);
    const [identities, setIdentities] = useState<string[]>([]);
    const [chosenProvider, setChosenProvider] = useState<string>("");
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);

    async function getProviders() {
        try {
            const providersResponse = await api.oauthGetProviders();
            const identitiesResponse = await api.oauthGetIdentities();
            const identitiesData = identitiesResponse.data.providers;
            setIdentities(identitiesData);
            setProviders(
                providersResponse.data.providers.filter(
                    (p: string) => identitiesData.indexOf(p) === -1
                )
            );
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function bindProvider(provider: string) {
        try {
            const response = await api.oauthAuthenticate(provider);
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
            {identities.length ? (
                <p className="font-weight-bold">
                    Here is the list of connected identity providers:
                </p>
            ) : (
                <p className="font-weight-bold">
                    Currently not associated with any external identity
                    provider.
                </p>
            )}
            <ShowIf condition={identities.length !== 0}>
                <>
                    {identities.map((identity) => (
                        <div key={identity} className="card">
                            <div className="card-body">
                                <h5 className="card-subtitle text-muted">
                                    <span className="text-monospace list-inline-item">
                                        {identity}
                                    </span>
                                </h5>
                            </div>
                        </div>
                    ))}
                </>
            </ShowIf>
            {providers.length ? (
                <div>
                    <b>Actions:</b>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a
                                href="#bind-oauth-account"
                                className="nav-link"
                                onClick={(ev) => {
                                    ev.preventDefault();
                                    setAddModalOpen(true);
                                }}
                            >
                                <FontAwesomeIcon icon={faPlus} /> Connect with
                                external identity
                            </a>
                        </li>
                    </ul>
                </div>
            ) : (
                <div>
                    <p className="font-weight-bold">
                        There is no more identity provider with which you can
                        link your account.
                    </p>
                </div>
            )}
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
