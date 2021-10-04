import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";

import queryString from "query-string";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View, getErrorMessage } from "@mwdb-web/commons/ui";
import { ConfirmationModal, ShowIf } from "@mwdb-web/commons/ui";

export function OAuthLogin() {
    const api = useContext(APIContext);
    const [error, setError] = useState();
    const [providers, setProviders] = useState([]);
    const [chosenProvider, setChosenProvider] = useState();
    const [isRedirectModalOpen, setRedirectModalOpen] = useState(false);
    const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);

    async function getProviders() {
        try {
            const response = await api.oauthGetProviders();
            setProviders(response.data["providers"]);
        } catch (e) {
            setError(e);
        }
    }

    async function authenticate(provider, action) {
        try {
            const response = await api.oauthAuthenticate(provider);
            const expirationTime = Date.now() + 5 * 60 * 1000;
            sessionStorage.setItem(
                `openid_${response.data["state"]}`,
                JSON.stringify({
                    provider: provider,
                    nonce: response.data["nonce"],
                    action: action,
                    expiration: expirationTime,
                })
            );
            window.location = response.data["authorization_url"];
        } catch (e) {
            setError(e);
        }
    }

    useEffect(() => {
        getProviders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View error={error}>
            <h2>External authentication</h2>
            <p>
                Select below the identity provider associated with your mwdb
                account. By clicking on the identity provider below you will be
                redirected to its authentication page. <br />
                If you don't have an account associated with any of these
                providers you can do this in the profile details. <br />
                Alternatively, you can register a new account through an
                external identity provider by{" "}
                <Link
                    href="#new-oauth-user"
                    onClick={(ev) => {
                        ev.preventDefault();
                        setRegisterModalOpen(true);
                    }}
                >
                    clicking here
                </Link>
                .
            </p>
            <ShowIf condition={providers.length}>
                {providers.map((provider) => (
                    <div className="d-flex justify-content-center">
                        <div className="col-6 text-center">
                            <Link
                                href="#"
                                className="card btn-outline-secondary text-decoration-none"
                                onClick={(ev) => {
                                    ev.preventDefault();
                                    setChosenProvider(provider);
                                    setRedirectModalOpen(true);
                                }}
                            >
                                <div className="card-body">
                                    <h5>{provider}</h5>
                                </div>
                            </Link>
                        </div>
                    </div>
                ))}
            </ShowIf>
            <ConfirmationModal
                isOpen={isRedirectModalOpen}
                onRequestClose={() => {
                    setRedirectModalOpen(false);
                    setChosenProvider("");
                }}
                onConfirm={(e) => {
                    e.preventDefault();
                    authenticate(chosenProvider, "authorize");
                }}
                message={`Are you sure you want to redirect to ${chosenProvider} provider`}
                buttonStyle="btn-danger"
            />
            <ConfirmationModal
                isOpen={isRegisterModalOpen}
                onRequestClose={() => setRegisterModalOpen(false)}
                message="Choose OpenID Provider to register user"
                onConfirm={(e) => {
                    e.preventDefault();
                    authenticate(chosenProvider, "register");
                }}
                buttonStyle="btn-info"
                confirmText="Submit"
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
        </View>
    );
}

export function OAuthAuthorize() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const history = useHistory();
    // Current query set in URI path
    const { code, state } = queryString.parse(history.location.search);

    async function authorize() {
        const stateData = sessionStorage.getItem(`openid_${state}`);
        if (!stateData) {
            history.push("/", { error: "Invalid state data" });
        }
        const { provider, nonce, action, expiration } = JSON.parse(stateData);
        sessionStorage.removeItem(`openid_${state}`);
        try {
            const expirationTime = new Date(expiration);
            if (Date.now() > expirationTime)
                throw new Error("Session expired. Please try again.");
            const response = await api.oauthCallback(
                provider,
                action,
                code,
                nonce,
                state
            );
            if (action === "bind_account") {
                history.replace("/profile/oauth", {
                    success: "New external identity successfully added",
                });
            } else {
                auth.updateSession(response.data);
                history.replace("/");
            }
        } catch (e) {
            if (action === "bind_account")
                history.replace("/profile/oauth", {
                    error: getErrorMessage(e),
                });
            else history.replace("/oauth/login", { error: getErrorMessage(e) });
        }
    }

    useEffect(() => {
        authorize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div>Wait for authorization...</div>;
}
