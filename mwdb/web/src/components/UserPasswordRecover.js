import React, { Component } from "react";
import ReCAPTCHA from "react-google-recaptcha";

import api from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

export default class UserPasswordRecover extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState;
    }

    static contextType = ConfigContext;

    get initialState() {
        return {
            login: "",
            email: "",
            success: false,
            dirty: false,
            error: null,
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

    async recoverPassword() {
        try {
            await api.authRecoverPassword(
                this.state.login,
                this.state.email,
                this.state.recaptcha
            );
            this.setState({
                success: true,
            });
        } catch (error) {
            this.setState({ ...this.initialState, error });
        }
    }

    onCaptchaChange = (value) => {
        this.setState({ recaptcha: value });
    };

    handleSubmit = (event) => {
        event.preventDefault();
        this.recoverPassword();
    };

    render() {
        let success = this.state.success && (
            <div>Password reset link has been sent to the e-mail address</div>
        );

        return (
            <View success={success} error={success ? null : this.state.error}>
                <h2>Recover password</h2>
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>Login</label>
                        <input
                            type="text"
                            name="login"
                            value={this.state.login}
                            onChange={this.handleInputChange}
                            className="form-control"
                            disabled={this.state.success}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={this.state.email}
                            onChange={this.handleInputChange}
                            className="form-control"
                            disabled={this.state.success}
                            required
                        />
                    </div>
                    <div>
                        <label>
                            Please enter the information above to recover your
                            password.
                        </label>
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
                        disabled={this.state.success}
                    />
                </form>
            </View>
        );
    }
}
