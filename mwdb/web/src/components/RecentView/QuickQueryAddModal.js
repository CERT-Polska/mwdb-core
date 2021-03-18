import React, { Component } from "react";
import { Alert, ConfirmationModal } from "@mwdb-web/commons/ui";

class QuickQueryAddModal extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState;
    }

    get initialState() {
        return {
            value: "",
        };
    }

    handleValueChange = (ev) => {
        this.setState({ value: ev.target.value });
    };

    handleClose = (ev) => {
        this.setState(this.initialState);
        this.props.onRequestModalClose();
    };

    handleSubmit = (ev) => {
        if (!this.state.value) {
            this.props.onError("Please set name for your quick query.");
        } else {
            ev.preventDefault();
            this.props.onSubmit(this.state.value);
        }
    };

    render() {
        return (
            <ConfirmationModal
                buttonStyle="btn-success"
                confirmText="Add"
                message="Add new custom quick query"
                isOpen={this.props.isOpen}
                onRequestClose={this.handleClose}
                onConfirm={this.handleSubmit}
            >
                <form onSubmit={this.handleSubmit}>
                    <Alert error={this.props.error} />
                    <div className="row pb-2">
                        <input
                            type="text"
                            className="form-control"
                            style={{ width: "470px" }}
                            placeholder="Set name for your quick query"
                            onChange={this.handleValueChange}
                            name="name"
                            required
                        />
                    </div>
                </form>
            </ConfirmationModal>
        );
    }
}

export default QuickQueryAddModal;
