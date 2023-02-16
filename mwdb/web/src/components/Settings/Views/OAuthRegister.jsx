import React, { useContext, useState } from "react";

import { APIContext } from "@mwdb-web/commons/api";

import { ShowIf, useViewAlert } from "@mwdb-web/commons/ui";

export default function OAuthRegister() {
    const api = useContext(APIContext);
    const viewAlert = useViewAlert();
    const [pureData, setPureData] = useState("");
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

    async function updateDiscoveryData(url) {
        try {
            var req = await api.oauthGetDiscoveryData(url);
            setPureData(JSON.stringify(JSON.parse(req.data.pure), null, 4));
            setValues((prevState) => ({
                ...prevState,
                authorization_endpoint: req.data.authorization_endpoint,
                token_endpoint: req.data.token_endpoint,
                userinfo_endpoint: req.data.userinfo_endpoint,
                jwks_endpoint: req.data.jwks_endpoint,
                logout_endpoint: req.data.logout_endpoint,
            }));
            viewAlert.setAlert({ success: "Endpoints updated" });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Register new identity provider</h2>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    updateDiscoveryData(e.target.discover_endpoint.value);
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
                <ShowIf condition={pureData}>
                    <textarea
                        type="text"
                        rows="10"
                        width="100%"
                        className="form-control"
                        value={pureData}
                        disabled
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setPureData("");
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
