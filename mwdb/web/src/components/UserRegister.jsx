import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

import { api } from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

export default function UserRegister() {
    const config = useContext(ConfigContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [disable, setDisable] = useState(false);
    const [recaptcha, setRecaptcha] = useState(null);
    const [state, setState] = useState({
        login: "",
        email: "",
        affiliation: "",
        job_title: "",
        job_responsibilities: "",
        other_info: "",
    });

    const locationState = location.state || {};

    async function registerUser() {
        try {
            setDisable(true);
            let additional_info = `Affiliation: ${state.affiliation}, Job title: ${state.job_title}, ${state.job_responsibilities} ${state.other_info}`;
            let response = await api.registerUser(
                state.login,
                state.email,
                additional_info,
                recaptcha
            );
            setSuccess(response.data.login);
            setError(null);
        } catch (e) {
            setError(e);
            setDisable(false);
        }
    }

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

    const handleSubmit = (event) => {
        event.preventDefault();
        registerUser();
    };

    return (
        <div className="register-form">
            <div className="register-form__background" />
            <div className="register-form__container">
                <View
                    ident="userRegister"
                    error={error}
                    success={
                        success && (
                            <div>
                                User {success} registration requested. Account
                                is waiting for confirmation.
                            </div>
                        )
                    }
                >
                    <h2 className="text-center">Register user</h2>
                    <p className="text-center">
                        Provided data are needed for vetting process. Keep in
                        mind that all submissions are reviewed manually, so the
                        approval process can take a few days. Before filling
                        this form, make sure you have read our{" "}
                        <Link to="/terms/en">Terms of use</Link>.
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="form-group col-md">
                                <label className="required">Login</label>
                                <input
                                    type="text"
                                    name="login"
                                    value={state.login}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                    pattern="[A-Za-z0-9_-]{1,32}"
                                    disabled={disable}
                                />
                                <div className="form-hint">
                                    Login must contain only letters, digits, '_'
                                    and '-' characters, max 32 characters
                                    allowed.
                                </div>
                            </div>
                            <div className="form-group col-md">
                                <label className="required">
                                    Business e-mail
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={state.email}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                    disabled={disable}
                                />
                            </div>
                        </div>
                        <b>Additional information:</b>
                        <div className="row">
                            <div className="form-group col-md">
                                <label className="required">Affiliation</label>
                                <input
                                    type="text"
                                    name="affiliation"
                                    value={state.affiliation}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                    disabled={disable}
                                />
                                <div className="form-hint">
                                    Provide name of company or university
                                </div>
                            </div>
                            <div className="form-group col-md">
                                <label className="required">Job Title</label>
                                <input
                                    type="text"
                                    name="job_title"
                                    value={state.job_title}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                    disabled={disable}
                                />
                                <div className="form-hint">
                                    Provide your job title
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="required">
                                Job Responsibilities
                            </label>
                            <input
                                type="text"
                                name="job_responsibilities"
                                value={state.job_responsibilities}
                                onChange={handleInputChange}
                                className="form-control"
                                required
                                disabled={disable}
                            />
                            <div className="form-hint">
                                Provide your job responsibilities and experience
                                in the field of malware analysis
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="required">
                                Other information
                            </label>
                            <textarea
                                name="other_info"
                                value={state.other_info}
                                onChange={handleInputChange}
                                className="form-control"
                                required
                                disabled={disable}
                            />
                            <div className="form-hint">
                                Provide additional information e.g. Twitter
                                handle, invitation info, blog URL etc.
                            </div>
                        </div>
                        {config.config["recaptcha_site_key"] && (
                            <ReCAPTCHA
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                                sitekey={config.config["recaptcha_site_key"]}
                                onChange={(value) => setRecaptcha(value)}
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
                                disabled={disable}
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
