import React, { useContext, useState } from "react";

import { APIContext } from "@mwdb-web/commons/api/context";

import { useViewAlert } from "@mwdb-web/commons/ui";

export default function OAuthRegister() {
    const api = useContext(APIContext);
    const viewAlert = useViewAlert();
    const [values, setValues] = useState({
        userinfo_endpoint: "",
        jwks_endpoint: "",
        token_endpoint: "",
        name: "",
        authorization_endpoint: "",
        client_id: "",
        client_secret: "",
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
                values.userinfo_endpoint,
                values.token_endpoint,
                values.jwks_endpoint
            );
            viewAlert.redirectToAlert({
                target: `/settings/oauth`,
                success: "Provider registered successfully",
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    return (
        <div className="container">
            <h2>Register new identity provider</h2>
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
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                />
            </form>
        </div>
    );
}
