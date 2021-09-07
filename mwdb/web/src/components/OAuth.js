import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";

import queryString from "query-string";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View, getErrorMessage } from "@mwdb-web/commons/ui";

export function OAuthLogin() {
    const api = useContext(APIContext);
    const [error, setError] = useState();
    const [providers, setProviders] = useState([]);
    const [chosenProvider, setChosenProvider] = useState();

    async function getProviders() {
        try {
            const response = await api.axios.get("/oauth");
            setProviders(response.data["providers"]);
        } catch (e) {
            setError(e);
        }
    }

    async function login(provider) {
        try {
            const response = await api.axios.post(
                `/oauth/${provider}/authenticate`
            );
            sessionStorage.setItem(
                `openid_${response.data["state"]}`,
                JSON.stringify({
                    provider: provider,
                    nonce: response.data["nonce"],
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
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    login(chosenProvider);
                }}
            >
                <select
                    className="custom-select"
                    value={chosenProvider}
                    onChange={(ev) => setChosenProvider(ev.target.value)}
                >
                    <option value="" hidden>
                        Select provider...
                    </option>
                    {providers.map((provider) => (
                        <option value={provider}>{provider}</option>
                    ))}
                </select>
                <button type="submit" className="btn btn-outline-success">
                    Login
                </button>
            </form>
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
        try {
            const stateData = sessionStorage.getItem(`openid_${state}`);
            if (!stateData) {
                // Invalid authorization state
            }
            const { provider, nonce } = JSON.parse(stateData);
            const response = await api.axios.post(
                `/oauth/${provider}/authorize`,
                {
                    code,
                    nonce,
                    state,
                }
            );
            sessionStorage.removeItem(`openid_${state}`);
            auth.updateSession(response.data);
            history.push("/");
        } catch (e) {
            history.push("/oauth/login", { error: getErrorMessage(e) });
        }
    }

    useEffect(() => {
        authorize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div>Wait for authorization...</div>;
}
