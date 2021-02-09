import React, { Component } from "react";

import api from "@mwdb-web/commons/api";
import { Alert } from "@mwdb-web/commons/ui";

class AttributeDefine extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState;
    }

    get initialState() {
        return {
            metakey: "",
            label: "",
            description: "",
            template: "",
            hidden: false,
        };
    }

    componentDidMount() {
        this.setState(this.initialState);
    }

    handleInputChange = (event) => {
        const target = event.target;
        const value =
            target.type === "checkbox" ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value,
        });
    };

    async defineMetakey() {
        try {
            await api.addMetakeyDefinition(
                this.state.metakey,
                this.state.label,
                this.state.description,
                this.state.template,
                this.state.hidden
            );
            this.props.history.push(`/attribute/${this.state.metakey}`);
        } catch (error) {
            this.setState({ ...this.initialState, error });
        }
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.defineMetakey();
    };

    render() {
        return (
            <div className="container">
                <Alert error={this.state.error} />
                <h2>Define new attribute</h2>
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <label>Key</label>
                        <input
                            type="text"
                            name="metakey"
                            value={this.state.metakey}
                            onChange={this.handleInputChange}
                            className="form-control"
                            required
                            pattern="[a-z0-9_-]{1,32}"
                            disabled={this.state.success}
                        />
                        <div className="form-hint">
                            Key must contain only lowercase letters and digits,
                            max 32 characters allowed.
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Label</label>
                        <input
                            type="text"
                            name="label"
                            value={this.state.label}
                            onChange={this.handleInputChange}
                            className="form-control"
                        />
                        <div className="form-hint">
                            User-friendly name for attribute (optional)
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <input
                            type="text"
                            name="description"
                            value={this.state.description}
                            onChange={this.handleInputChange}
                            className="form-control"
                        />
                        <div className="form-hint">
                            Description of the attribute meaning (optional)
                        </div>
                    </div>
                    <div className="form-group">
                        <label>URL template</label>
                        <input
                            type="text"
                            name="template"
                            value={this.state.template}
                            onChange={this.handleInputChange}
                            className="form-control"
                        />
                        <div className="form-hint">
                            Provide URL template for specified attribute with
                            $value as a placeholder (e.g.
                            http://system.cert.pl/job/$value)
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Hidden attribute</label>
                        <div className="material-switch">
                            <input
                                type="checkbox"
                                name="hidden"
                                onChange={this.handleInputChange}
                                id="hidden_checkbox"
                                checked={this.state.hidden}
                            />
                            <label
                                htmlFor="hidden_checkbox"
                                className="bg-primary"
                            ></label>
                        </div>
                        <div className="form-hint">
                            Hidden attributes have protected values. Attribute
                            values are not visible for users without
                            reading_all_attributes capability and explicit
                            request for reading them. Also only exact search is
                            allowed. User still must have permission to read key
                            to use it in query.
                        </div>
                    </div>
                    <input
                        type="submit"
                        value="Submit"
                        className="btn btn-primary"
                    />
                </form>
            </div>
        );
    }
}

export default AttributeDefine;
