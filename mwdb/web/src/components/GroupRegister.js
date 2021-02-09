import React, { Component } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { View } from "@mwdb-web/commons/ui";

class GroupRegister extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState;

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    get initialState() {
        return {
            name: "",
            success: false,
            dirty: false,
            error: null,
        };
    }

    componentDidMount() {
        if (this.dirty) this.setState(this.initialState);
    }

    handleInputChange(event) {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value,
            dirty: true,
        });
    }

    async handleSubmit(event) {
        event && event.preventDefault();
        try {
            let response = await api.registerGroup(this.state.name);
            this.setState({ success: response.data.name });
        } catch (error) {
            this.setState({ ...this.initialState, error });
        }
    }

    render() {
        let success = this.state.success && (
            <div>
                Group{" "}
                <Link to={`/group/${this.state.success}`}>
                    {this.state.success}
                </Link>{" "}
                created successfully.
            </div>
        );
        return (
            <View
                ident="GroupRegister"
                error={this.state.error}
                success={success}
            >
                <h2>Create group</h2>
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            name="name"
                            value={this.state.name}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            pattern="[A-Za-z0-9_-]{1,32}"
                            disabled={this.state.success}
                        />
                        <div class="form-hint">
                            Group name must contain only letters, digits, '_'
                            and '-' characters , max 32 characters allowed.
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

export default GroupRegister;
