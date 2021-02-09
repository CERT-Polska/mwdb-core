import React, { Component } from "react";
import { Link } from "react-router-dom";
import { View } from "@mwdb-web/commons/ui";
import api from "@mwdb-web/commons/api";

class UserCreate extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState;
    }

    get initialState() {
        return {
            login: "",
            email: "",
            additional_info: "",
            feed_quality: "high",
            send_email: true,
            role: "0",
            success: false,
            dirty: false,
            error: null,
            groups: [],
            group: "-1",
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

    async createUser() {
        try {
            let response = await api.createUser(
                this.state.login,
                this.state.email,
                this.state.additional_info,
                this.state.feed_quality,
                this.state.send_email
            );
            this.setState({
                success: response.data.login,
            });
        } catch (error) {
            this.setState({ ...this.initialState, error });
        }
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.createUser();
    };

    render() {
        let success = this.state.success && (
            <div>
                User{" "}
                <Link to={`/user/${this.state.success}`}>
                    {this.state.success}
                </Link>{" "}
                registered successfully. Click to generate password reset link.
            </div>
        );
        return (
            <View ident="userCreate" error={this.state.error} success={success}>
                <h2>Create new user</h2>
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
                            disabled={this.state.success}
                        />
                        <div class="form-hint">
                            Login must contain only letters, digits, '_' and '-'
                            characters, max 32 characters allowed.
                        </div>
                    </div>
                    <div className="form-group">
                        <label>E-mail</label>
                        <input
                            type="email"
                            name="email"
                            value={this.state.email}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.success}
                        />
                        <div class="form-hint">
                            Make sure that provided e-mail is active for
                            administration purposes
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Additional info</label>
                        <input
                            type="text"
                            name="additional_info"
                            value={this.state.additional_info}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            disabled={this.state.success}
                        />
                    </div>
                    <div className="form-group">
                        <label>Feed quality</label>
                        <select
                            onChange={this.handleInputChange}
                            name="feed_quality"
                            value={this.state.feed_quality}
                            className="form-control"
                        >
                            <option value="high">high</option>
                            <option value="low">low</option>
                        </select>
                    </div>
                    <div className="from-group">
                        <label>Send e-mail with set password link</label>
                        <div className="material-switch">
                            <input
                                type="checkbox"
                                name="send_email"
                                onChange={this.handleInputChange}
                                id="send_email_checkbox"
                                checked={this.state.send_email}
                                disabled={this.state.success}
                            />
                            <label
                                htmlFor="send_email_checkbox"
                                className="bg-success"
                            ></label>
                        </div>
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

export default UserCreate;
