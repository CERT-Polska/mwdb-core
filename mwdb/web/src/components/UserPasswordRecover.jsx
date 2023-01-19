import React, { useState, useContext } from "react";
import ReCAPTCHA from "react-google-recaptcha";

import api from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

export default function UserPasswordRecover() {
    const initialState = {
        login: "",
        email: "",
    };

    const config = useContext(ConfigContext);
    const [fieldState, setFieldState] = useState(initialState);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [recaptcha, setRecaptcha] = useState(null);

    const handleInputChange = (event) => {
        const value = event.target.value;
        const name = event.target.name;

        setFieldState((fieldState) => ({
            ...fieldState,
            [name]: value,
        }));
    };

    async function recoverPassword() {
        try {
            await api.authRecoverPassword(
                fieldState.login,
                fieldState.email,
                recaptcha
            );
            setSuccess(true);
        } catch (error) {
            setError(error);
            setFieldState(initialState);
        }
    }

    const onCaptchaChange = (value) => {
        setRecaptcha(value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        recoverPassword();
    };

    let successMessage = success && (
        <div>Password reset link has been sent to the e-mail address</div>
    );

    return (
        <View success={successMessage} error={success ? null : error}>
            <h2>Recover password</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Login</label>
                    <input
                        type="text"
                        name="login"
                        value={fieldState.login}
                        onChange={handleInputChange}
                        className="form-control"
                        disabled={success}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={fieldState.email}
                        onChange={handleInputChange}
                        className="form-control"
                        disabled={success}
                        required
                    />
                </div>
                <div>
                    <label>
                        Please enter the information above to recover your
                        password.
                    </label>
                </div>
                {config.config["recaptcha_site_key"] ? (
                    <ReCAPTCHA
                        sitekey={config.config["recaptcha_site_key"]}
                        onChange={onCaptchaChange}
                    />
                ) : (
                    []
                )}
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                    disabled={success}
                />
            </form>
        </View>
    );
}
