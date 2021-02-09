import React, { Component } from "react";

import api from "@mwdb-web/commons/api";
import { APIKeyList, ConfirmationModal } from "@mwdb-web/commons/ui";

class ManageAPIKeys extends Component {
    state = {
        showedId: null,
        token: null,
        modalIsOpen: false,
        keyToRemove: "",
    };

    previewKey = async (key_id) => {
        try {
            let response = await api.apiKeyGetToken(key_id);
            this.setState({
                showedId: key_id,
                token: response.data.token,
            });
        } catch (error) {
            this.props.onError(error);
        }
    };

    removeKey = async (key_id) => {
        try {
            this.setState({ modalIsOpen: false });
            await api.apiKeyRemove(key_id);
            this.props.onSuccess("Successfully removed the API key");
        } catch (error) {
            this.props.onError(error);
        }
    };

    addKey = async () => {
        try {
            await api.apiKeyAdd(this.props.userLogin);
            this.props.onSuccess("Successfully created the API key");
        } catch (error) {
            this.props.onError(error);
        }
    };

    handleRemoveKey = (key_id) => {
        this.setState({ modalIsOpen: true, keyToRemove: key_id });
    };

    closeKeyPreview = () => {
        this.setState({ showedId: null, token: null });
    };

    render() {
        return (
            <React.Fragment>
                <ConfirmationModal
                    isOpen={this.state.modalIsOpen}
                    onRequestClose={() => this.setState({ modalIsOpen: false })}
                    onConfirm={(e) => this.removeKey(this.state.keyToRemove)}
                    message={`Remove the API key ${this.state.keyToRemove}?`}
                    confirmText="Remove"
                />
                <APIKeyList
                    previewKey={this.previewKey}
                    removeKey={this.handleRemoveKey}
                    addKey={this.addKey}
                    closeKeyPreview={this.closeKeyPreview}
                    showedId={this.state.showedId}
                    token={this.state.token}
                    items={this.props.items}
                />
            </React.Fragment>
        );
    }
}

export default ManageAPIKeys;
