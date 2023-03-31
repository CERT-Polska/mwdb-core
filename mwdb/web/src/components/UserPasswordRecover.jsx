import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";

import { api } from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View, getErrorMessage } from "@mwdb-web/commons/ui";

export default function UserPasswordRecover() {
    const initialState = {
        login: "",
        email: "",
    };
    const navigate = useNavigate();
    const location = useLocation();
    const config = useContext(ConfigContext);
    const [fieldState, setFieldState] = useState(initialState);
    const [success, setSuccess] = useState(false);
    const [recaptcha, setRecaptcha] = useState(null);

    const locationState = location.state || {};

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
            toast("Password reset link has been sent to the e-mail address", {
                type: "success",
            });
        } catch (error) {
            toast(getErrorMessage(error), {
                type: "error",
            });
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

    return (
        <div className="user-password-recover">
            <div className="user-password-recover__background" />
            <div className="user-password-recover__container">
                <View>
                    <h2 className="text-center">Recover password</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="required">Login</label>
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
                            <label className="required">Email</label>
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
                                Please enter the information above to recover
                                your password.
                            </label>
                        </div>
                        {config.config["recaptcha_site_key"] && (
                            <ReCAPTCHA
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                                sitekey={config.config["recaptcha_site_key"]}
                                onChange={onCaptchaChange}
                            />
                        )}
                        <div className="d-flex justify-content-between">
                            <button
                                className="btn btn-outline-primary btn-lg"
                                onClick={() => {
                                    const prevLocation =
                                        locationState.prevLocation || "/";
                                    navigate(prevLocation);
                                }}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={success}
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </View>
            </div>
        </div>
    );
}
