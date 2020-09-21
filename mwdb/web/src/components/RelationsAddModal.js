import React, {Component} from 'react';
import { ConfirmationModal, View } from "@mwdb-web/commons/ui";

class RelationsAddModal extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState
    }

    get initialState() {
        return {
            relation: '',
            value: "",
        }
    }

    handleValueChange = (ev) => {
        this.setState({value: ev.target.value})
    }

    handleSelectChange = (ev) => {
        this.setState({relation: ev.target.value});
    }

    handleClose = (ev) => {
        this.setState(this.initialState)
        this.props.onRequestModalClose()
    }

    handleSubmit = (ev) => {
        ev.preventDefault();
        if (["parent","child"].indexOf(this.state.relation) === -1)
            this.props.onError("Please select parent or child relationship.")
        else
            this.props.onSubmit(this.state.relation, this.state.value);
    }

    render() {
        return (
            <ConfirmationModal buttonStyle="btn-success"
                               confirmText="Add"
                               message="Add relation"
                               isOpen={this.props.isOpen}
                               onRequestClose={this.handleClose}
                               onConfirm={this.handleSubmit}>
                <form onSubmit={this.handleSubmit}>
                    <View error={this.props.error}>
                        <table>
                            <tr>
                                <td>
                                <select className="form-control" value={this.state.relation} onChange={this.handleSelectChange}>
                                    <option value="" hidden>Select relationship</option>
                                    <option value="parent">parent</option>
                                    <option value="child">child</option>
                                </select>
                                </td>
                                <td>
                                <input type="text" className="form-control" style = {{"width": "600px"}}
                                       placeholder="Type object sha256 identifier..."
                                       onChange={this.handleValueChange}
                                       value={this.state.value}
                                       required />
                                </td>
                            </tr>
                        </table>
                    </View>
                </form>
            </ConfirmationModal>
        )
    }
}

export default RelationsAddModal;

