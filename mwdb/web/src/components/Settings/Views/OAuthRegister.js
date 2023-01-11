import React, { useContext, useState, useCallback, useEffect } from "react";

import { APIContext } from "@mwdb-web/commons/api/context";

import { ShowIf, useViewAlert } from "@mwdb-web/commons/ui";

export default function OAuthRegister() {
    const api = useContext(APIContext);
    const viewAlert = useViewAlert();
    const [discoverData, setDiscoverData] = useState();
    const [discoverURL, setDiscoverURL] = useState();
    const [values, setValues] = useState({
        userinfo_endpoint: "",
        jwks_endpoint: "",
        token_endpoint: "",
        name: "",
        authorization_endpoint: "",
        client_id: "",
        client_secret: "",
        logout_endpoint: "",
    });

    function handleInputChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        setValues((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    }

    function autoFill() {
        if (!discoverData) return;
        const keys = Object.keys(values);
        for (const i in keys) {
            if (typeof discoverData[keys[i]] !== "undefined")
                values[keys[i]] = discoverData[keys[i]];
        }
        if (typeof discoverData["jwks_uri"] === "undefined")
            discoverData["jwks_uri"] = "";

        if (typeof discoverData["end_session_endpoint"] === "undefined")
            discoverData["end_session_endpoint"] = "";

        values["jwks_endpoint"] = discoverData["jwks_uri"];
        values["logout_endpoint"] = discoverData["end_session_endpoint"];
        setDiscoverURL("");
    }

    async function registerProvider() {
        try {
            await api.oauthRegisterProvider(
                values.name,
                values.client_id,
                values.client_secret,
                values.authorization_endpoint,
                values.token_endpoint,
                values.userinfo_endpoint,
                values.jwks_endpoint,
                values.logout_endpoint
            );
            viewAlert.redirectToAlert({
                target: `/settings/oauth`,
                success: "Provider registered successfully",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    async function updateDiscoverData() {
        try {
            var req = new Request(discoverURL);
            fetch(req)
                .then(async (response) => {
                    return await response.json();
                })
                .then((x) => {
                    setDiscoverData(x);
                });
        } catch (e) {
            viewAlert.setAlert({ e });
        }
    }

    const getDiscover = useCallback(updateDiscoverData, [
        discoverURL,
        viewAlert,
    ]);
    // eslint-disable-next-line
    const autoFillCallback = useCallback(autoFill, [discoverData]);

    useEffect(() => {
        getDiscover();
    }, [getDiscover]);
    useEffect(() => {
        autoFillCallback();
    }, [autoFillCallback]);

    return (
        <div className="container">
            <h2>Register new identity provider</h2>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setDiscoverURL(e.target.discover_endpoint.value);
                }}
            >
                <div className="form-group">
                    <label>Discover endpoint</label>
                    <input
                        type="text"
                        name="discover_endpoint"
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="submit"
                        value="Get data"
                        className="btn btn-secondary"
                    />
                </div>
                <ShowIf condition={discoverData}>
                    <textarea
                        type="text"
                        rows="10"
                        width="100%"
                        className="form-control"
                        value={JSON.stringify(discoverData, null, 4)}
                        disabled
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setDiscoverURL("");
                            setDiscoverData(null);
                        }}
                    >
                        Hide output
                    </button>
                </ShowIf>
            </form>

            <form
                onSubmit={(ev) => {
                    ev.preventDefault();
                    registerProvider();
                }}
            >
                <div className="form-group">
                    <label>Provider name</label>
                    <input
                        type="text"
                        name="name"
                        value={values.name}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Client ID</label>
                    <input
                        type="text"
                        name="client_id"
                        value={values.client_id}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Client secret</label>
                    <input
                        type="text"
                        name="client_secret"
                        value={values.client_secret}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Authorization endpoint</label>
                    <input
                        type="text"
                        name="authorization_endpoint"
                        value={values.authorization_endpoint}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Token endpoint</label>
                    <input
                        type="text"
                        name="token_endpoint"
                        value={values.token_endpoint}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Userinfo endpoint</label>
                    <input
                        type="text"
                        name="userinfo_endpoint"
                        value={values.userinfo_endpoint}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Jwks endpoint</label>
                    <input
                        type="text"
                        name="jwks_endpoint"
                        value={values.jwks_endpoint}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Logout endpoint</label>
                    <input
                        type="text"
                        name="logout_endpoint"
                        value={values.logout_endpoint}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                />
            </form>
        </div>
    );
}
