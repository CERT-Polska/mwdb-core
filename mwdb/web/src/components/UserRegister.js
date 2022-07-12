import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

import api from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

export default function UserRegister() {
    const config = useContext(ConfigContext);
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
        <View
            ident="userRegister"
            error={error}
            success={
                success && (
                    <div>
                        User {success} registration requested. Account is
                        waiting for confirmation.
                    </div>
                )
            }
        >
            <h2>Register user</h2>
            <p>
                Provided data are needed for vetting process. Keep in mind that
                all submissions are reviewed manually, so the approval process
                can take a few days. Before filling this form, make sure you
                have read our <Link to="/terms/en">Terms of use</Link>.
            </p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Login</label>
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
                    <div class="form-hint">
                        Login must contain only letters, digits, '_' and '-'
                        characters, max 32 characters allowed.
                    </div>
                </div>
                <div className="form-group">
                    <label>Business e-mail</label>
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
                <b>Additional information:</b>
                <div className="form-group">
                    <label>Affiliation</label>
                    <input
                        type="text"
                        name="affiliation"
                        value={state.affiliation}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        disabled={disable}
                    />
                    <div class="form-hint">
                        Provide name of company or university
                    </div>
                </div>
                <div className="form-group">
                    <label>Job Title</label>
                    <input
                        type="text"
                        name="job_title"
                        value={state.job_title}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        disabled={disable}
                    />
                    <div class="form-hint">Provide your job title</div>
                </div>
                <div className="form-group">
                    <label>Job Responsibilities</label>
                    <input
                        type="text"
                        name="job_responsibilities"
                        value={state.job_responsibilities}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        disabled={disable}
                    />
                    <div class="form-hint">
                        Provide your job responsibilities and experience in the
                        field of malware analysis
                    </div>
                </div>
                <div className="form-group">
                    <label>Other information</label>
                    <textarea
                        type="text"
                        name="other_info"
                        value={state.other_info}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                        disabled={disable}
                    />
                    <div class="form-hint">
                        Provide additional information e.g. Twitter handle,
                        invitation info, blog URL etc.
                    </div>
                </div>
                {config.config["recaptcha_site_key"] ? (
                    <ReCAPTCHA
                        sitekey={config.config["recaptcha_site_key"]}
                        onChange={(value) => setRecaptcha(value)}
                    />
                ) : (
                    []
                )}
                <input
                    type="submit"
                    value="Submit"
                    className="btn btn-primary"
                    disabled={disable}
                />
            </form>
        </View>
    );
}
