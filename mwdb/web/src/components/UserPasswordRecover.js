import React, { useState, useContext } from "react";
import ReCAPTCHA from "react-google-recaptcha";

import api from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

export default function UserPasswordRecover() {
    const initialState = {
        login: "",
        email: "",
        success: false,
        error: null,
        recaptcha: null,
    };

    const config = useContext(ConfigContext);
    const [state, setState] = useState(initialState);

    const handleInputChange = (event) => {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        setState({
            ...state,
            [name]: value,
        });
    };

    async function recoverPassword() {
        try {
            await api.authRecoverPassword(
                state.login,
                state.email,
                state.recaptcha
            );
            setState({
                success: true,
            });
        } catch (error) {
            setState({ ...initialState, error });
        }
    }

    const onCaptchaChange = (value) => {
        setState({ ...state, recaptcha: value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        recoverPassword();
    };

    let success = state.success && (
        <div>Password reset link has been sent to the e-mail address</div>
    );

    return (
        <View success={success} error={success ? null : state.error}>
            <h2>Recover password</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Login</label>
                    <input
                        type="text"
                        name="login"
                        value={state.login}
                        onChange={handleInputChange}
                        className="form-control"
                        disabled={state.success}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={state.email}
                        onChange={handleInputChange}
                        className="form-control"
                        disabled={state.success}
                        required
                    />
                </div>
                <div>
                    <label>
                        Please enter the information above to recover your
                        password.
                    </label>
                </div>
                {config["recaptcha_site_key"] ? (
                    <ReCAPTCHA
                        sitekey={config["recaptcha_site_key"]}
                        onChange={onCaptchaChange}
                    />
                ) : (
                    []
                )}
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                    disabled={state.success}
                />
            </form>
        </View>
    );
}
