import React, { Component } from "react";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

import api from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

export default class UserRegister extends Component {
    static contextType = ConfigContext;

    constructor(props) {
        super(props);
        this.state = this.initialState;
    }

    get initialState() {
        return {
            login: "",
            email: "",
            affiliation: "",
            job_title: "",
            job_responsibilities: "",
            other_info: "",
            success: false,
            dirty: false,
            disable: false,
            error: null,
            groups: [],
            group: "-1",
            recaptcha: null,
        };
    }

    componentDidMount() {
        if (this.dirty) this.setState(this.initialState);
    }

    handleInputChange = (event) => {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value,
            dirty: true,
        });
    };

    onCaptchaChange = (value) => {
        this.setState({ recaptcha: value });
    };

    async registerUser() {
        try {
            this.setState({ disable: true });
            let additional_info = `Affiliation: ${this.state.affiliation}, Job title: ${this.state.job_title}, ${this.state.job_responsibilities} ${this.state.other_info}`;
            let response = await api.registerUser(
                this.state.login,
                this.state.email,
                additional_info,
                this.state.recaptcha
            );
            this.setState({
                success: response.data.login,
                error: null,
            });
        } catch (error) {
            this.setState({ error, disable: false });
        }
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.registerUser();
    };

    render() {
        let success = this.state.success && (
            <div>
                User {this.state.success} registration requested. Account is
                waiting for confirmation.
            </div>
        );
        return (
            <View
                ident="userRegister"
                error={this.state.error}
                success={success}
            >
                <h2>Register user</h2>
                <p>
                    Provided data are needed for vetting process. Keep in mind
                    that all submissions are reviewed manually, so the approval
                    process can take a few days. Before filling this form, make
                    sure you have read our{" "}
                    <Link to="/terms/en">Terms of use</Link>.
                </p>
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>Login</label>
                        <input
                            type="text"
                            name="login"
                            value={this.state.login}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            pattern="[A-Za-z0-9_-]{1,32}"
                            disabled={this.state.disable}
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
                            value={this.state.email}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.disable}
                        />
                    </div>
                    <b>Additional information:</b>
                    <div className="form-group">
                        <label>Affiliation</label>
                        <input
                            type="text"
                            name="affiliation"
                            value={this.state.affiliation}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.disable}
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
                            value={this.state.job_title}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.disable}
                        />
                        <div class="form-hint">Provide your job title</div>
                    </div>
                    <div className="form-group">
                        <label>Job Responsibilities</label>
                        <input
                            type="text"
                            name="job_responsibilities"
                            value={this.state.job_responsibilities}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.disable}
                        />
                        <div class="form-hint">
                            Provide your job responsibilities and experience in
                            the field of malware analysis
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Other information</label>
                        <textarea
                            type="text"
                            name="other_info"
                            value={this.state.other_info}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.disable}
                        />
                        <div class="form-hint">
                            Provide additional information e.g. Twitter handle,
                            invitation info, blog URL etc.
                        </div>
                    </div>
                    {this.context.config["recaptcha_site_key"] ? (
                        <ReCAPTCHA
                            sitekey={this.context.config["recaptcha_site_key"]}
                            onChange={this.onCaptchaChange}
                        />
                    ) : (
                        []
                    )}
                    <input
                        type="submit"
                        value="Submit"
                        className="btn btn-primary"
                        disabled={this.state.disable}
                    />
                </form>
            </View>
        );
    }
}
