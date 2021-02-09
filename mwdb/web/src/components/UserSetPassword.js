import React, { Component } from "react";
import { Link } from "react-router-dom";
import { View } from "@mwdb-web/commons/ui";

import $ from "jquery";
import api from "@mwdb-web/commons/api";

class UserSetPassword extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState;
    }

    get initialState() {
        return {
            password: "",
            repeatPassword: "",
            success: false,
            dirty: false,
            error: null,
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

        this.setState(
            {
                [name]: value,
                dirty: true,
            },
            () => {
                const encoder = new TextEncoder();
                let repeatPasswordElement = $("#repeatPassword")[0];
                if (this.state.password !== this.state.repeatPassword) {
                    repeatPasswordElement.setCustomValidity(
                        "Passwords doesn't match"
                    );
                } else if (
                    encoder.encode(this.state.repeatPassword).length > 72
                ) {
                    repeatPasswordElement.setCustomValidity(
                        "The password should contain no more than 72 bytes of UTF-8 characters, your password is too long."
                    );
                } else {
                    repeatPasswordElement.setCustomValidity("");
                }
            }
        );
    };

    handleSubmit = async (event) => {
        event.preventDefault();
        try {
            let response = await api.authSetPassword(
                this.props.match.params.token,
                this.state.password
            );
            this.setState({ success: response.data.login, error: null });
        } catch (error) {
            this.setState({ ...this.initialState, error });
        }
    };

    isConfirmedPassword = (value) => {
        return value === this.state.password;
    };

    render() {
        let success = this.state.success && (
            <div>
                Password for {this.state.success} set successfully.{" "}
                <Link to="/login">Log in.</Link>
            </div>
        );
        return (
            <View
                ident="userSetPassword"
                error={this.state.error}
                success={success}
            >
                <h2>Set password</h2>
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>New password</label>
                        <input
                            type="password"
                            minLength="8"
                            name="password"
                            value={this.state.password}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.success}
                        />
                    </div>
                    <div className="form-group">
                        <label>Repeat new password</label>
                        <input
                            type="password"
                            minLength="8"
                            name="repeatPassword"
                            value={this.state.repeatPassword}
                            id="repeatPassword"
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.success}
                        />
                    </div>
                    <input
                        type="submit"
                        value="Submit"
                        className="btn btn-primary"
                    />
                </form>
            </View>
        );
    }
}

export default UserSetPassword;
