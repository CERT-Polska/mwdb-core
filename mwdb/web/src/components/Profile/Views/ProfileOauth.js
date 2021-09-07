import React, { useContext, useEffect, useState } from "react";

import { APIContext } from "@mwdb-web/commons/api/context";

import { useViewAlert } from "@mwdb-web/commons/ui";

export function ProfileOauth() {
    const api = useContext(APIContext);
    const viewAlert = useViewAlert();
    const [providers, setProviders] = useState([]);
    const [chosenProvider, setChosenProvider] = useState();

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
            sessionStorage.setItem(
                `openid_${response.data["state"]}`,
                JSON.stringify({
                    provider: provider,
                    nonce: response.data["nonce"],
                    action: "bind_account",
                    expiration: new Date() + 5,
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
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    bindProvider(chosenProvider);
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
        </div>
    );
}
