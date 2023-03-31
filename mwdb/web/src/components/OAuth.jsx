import React, { useContext, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { api } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { getErrorMessage } from "@mwdb-web/commons/ui";

export async function authenticate(provider, action) {
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
        toast(getErrorMessage(e), {
            type: "error",
        });
    }
}

export function ProviderButton({ provider, color }) {
    const chosenProvider = provider;

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                authenticate(chosenProvider, "authorize");
            }}
            className="form-control btn btn-primary mb-1"
            style={{
                backgroundColor: color,
                borderStyle: "none",
            }}
        >
            Log in with {chosenProvider}
        </button>
    );
}

export function ProvidersSelectList({ providersList }) {
    const availableProviders = providersList;
    const [chosenProvider, setChosenProvider] = useState();

    return (
        <form>
            <select
                className="custom-select"
                onChange={(e) => {
                    setChosenProvider(e.target.value);
                }}
            >
                <option value="" hidden>
                    Select provider...
                </option>
                {availableProviders.map((provider) => (
                    <option value={provider}>{provider}</option>
                ))}
            </select>
            <button
                className="form-control btn btn-primary mt-1"
                style={{ backgroundColor: "#3c5799" }}
                onClick={(e) => {
                    e.preventDefault();
                    authenticate(chosenProvider, "authorize");
                }}
            >
                Log in with selected provider
            </button>
        </form>
    );
}

export function OAuthAuthorize() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    // Current query set in URI path
    const searchParams = useSearchParams()[0];
    const { code, state } = Object.fromEntries(searchParams);

    async function authorize() {
        const stateData = sessionStorage.getItem(`openid_${state}`);
        if (!stateData) {
            toast("Invalid state data", { type: "error" });
            navigate("/");
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
                toast("New external identity successfully added", {
                    type: "success",
                });
                navigate("/profile/oauth", {
                    replace: true,
                });
            } else {
                auth.updateSession(response.data);
                navigate("/", {
                    replace: true,
                });
            }
        } catch (e) {
            toast(getErrorMessage(e), {
                type: "error",
            });
            if (action === "bind_account") {
                navigate("/profile/oauth", {
                    replace: true,
                });
            } else {
                navigate("/login", {
                    state: {
                        attemptedProvider: provider,
                    },
                    replace: true,
                });
            }
        }
    }

    useEffect(() => {
        authorize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div>Wait for authorization...</div>;
}
