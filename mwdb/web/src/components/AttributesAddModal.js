import React, { Component } from "react";

import api from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

export default class AttributesAddModal extends Component {
    state = {
        attributes: [],
        attributeKey: "",
        attributeValue: "",
    };

    attributesForm = React.createRef();

    static contextType = AuthContext;

    handleSubmit = (event) => {
        if (event) event.preventDefault();
        if (
            !this.attributesForm.current ||
            !this.attributesForm.current.reportValidity()
        )
            return;
        this.props.onAdd(
            this.state.attributeKey.toLowerCase(),
            this.state.attributeValue
        );
    };

    async updateAttributesList() {
        try {
            let response = await api.getSettableMetakeyDefinitions();
            let attributes = {};
            for (let attribute of response.data.metakeys) {
                attributes[attribute.label || attribute.key] = attribute;
            }
            this.setState({ attributes });
        } catch (error) {
            console.error(error);
            this.setState({ error });
        }
    }

    handleAttributeChange = (ev) => {
        let chosenAttribute = ev.target.value;
        this.setState({
            chosenAttribute,
            attributeKey: this.state.attributes[chosenAttribute].key,
        });
    };

    handleValueChange = (ev) => {
        this.setState({ attributeValue: ev.target.value });
    };

    get attributeHint() {
        if (!this.state.chosenAttribute) return undefined;
        return this.state.attributes[this.state.chosenAttribute].description;
    }

    componentDidMount() {
        this.updateAttributesList();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.isOpen !== this.props.isOpen) this.updateAttributesList();
    }

    render() {
        return (
            <ConfirmationModal
                buttonStyle="btn-success"
                confirmText="Add"
                message="Add attribute"
                isOpen={this.props.isOpen}
                onRequestClose={this.props.onRequestClose}
                onConfirm={this.handleSubmit}
            >
                {!this.context.hasCapability("adding_all_attributes") &&
                !Object.keys(this.state.attributes).length ? (
                    <div>
                        Sorry, there are no attributes you can set at this
                        moment.
                    </div>
                ) : (
                    <form
                        ref={this.attributesForm}
                        onSubmit={this.handleSubmit}
                    >
                        <div className="form-group">
                            <label>Attribute</label>
                            <select
                                className="form-control"
                                onChange={this.handleAttributeChange}
                                value={this.state.chosenAttribute}
                                required
                            >
                                <option key="" value="">
                                    &nbsp;
                                </option>
                                {Object.keys(this.state.attributes)
                                    .sort()
                                    .map((attr) => (
                                        <option key={attr} value={attr}>
                                            {attr}
                                        </option>
                                    ))}
                            </select>
                            {this.attributeHint ? (
                                <div class="form-hint">
                                    {this.attributeHint}
                                </div>
                            ) : (
                                []
                            )}
                        </div>
                        <div className="form-group">
                            <label>Value</label>
                            <input
                                type="text"
                                className="form-control"
                                onChange={this.handleValueChange}
                                value={this.state.attributeValue}
                                required
                            />
                        </div>
                    </form>
                )}
            </ConfirmationModal>
        );
    }
}
