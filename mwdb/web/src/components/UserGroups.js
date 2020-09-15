import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import {makeSearchLink} from "@malwarefront/helpers";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import api from "@malwarefront/api";
import { View, HighlightText, ConfirmationModal } from "@malwarefront/ui";

class UserGroupRow extends Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false,
            isRemoveModalOpen: false,
            isAddModalOpen: false,
            newMember: null,
            removeUser: null,
        }
    }

    _toggle() {
        this.setState({
            open: !this.state.open
        })
    }

    handleValueChange = (ev) => {
        this.setState({newMember: ev.target.value})
    }

    addMember = async (login) => {
        try {
            await api.addGroupMember(this.props.group.name, login);
            this.props.groupUpdate();
            this.props.onSuccess("Member added successfully");
        } catch (error) {
            this.props.onError(error);
        }
    }

    removeMember = async(login) => {
        try {
            await api.removeGroupMember(this.props.group.name, login);
            this.props.groupUpdate();
            this.props.onSuccess("Member removed successfully")
        } catch (error) {
            this.props.onError(error)
        }
    }

    render(){
        let modal = (this.state.isAddModalOpen) ?
            <ConfirmationModal isOpen={this.state.isAddModalOpen}
                               buttonStyle="btn-success"
                               confirmText="Add"
                               onRequestClose={() => this.setState({isAddModalOpen: false, newMember: null})}
                               onConfirm={() => {
                                   this.addMember(this.state.newMember);
                                   this.setState({isAddModalOpen: false});
                               }}
                               message={`Add new member to ${this.props.group.name}: `}
                                >
                <form>
                    <div className="row pb-2">
                        <input type="text" className="form-control"
                               placeholder="Please enter the user login"
                               onChange={this.handleValueChange}
                               name="newMember"
                               required />
                    </div>
                </form>
            </ConfirmationModal>
         :
            <ConfirmationModal isOpen={this.state.isRemoveModalOpen}
                               onRequestClose={() => this.setState({isRemoveModalOpen: false, removeUser: null})}
                               onConfirm={() => {
                                   this.removeMember(this.state.removeUser);
                                   this.setState({isRemoveModalOpen: false, removeUser: null});
                               }}
                               message={`Are you sure to delete ${this.state.removeUser} user from group?`}
                                />
        return (
            <React.Fragment>
                <tr className="d-flex">
                    <th className="col-8" style={{cursor: 'pointer'}} onClick={this._toggle.bind(this)}>
                        <FontAwesomeIcon icon={this.state.open ? "minus" : "plus"} size="sm"/>
                        {" "}
                        <Link to={`/group/${this.props.group.name}`}>
                            <HighlightText>{this.props.group.name}</HighlightText>
                        </Link>
                    </th>
                    <td className="col-4">
                        <button type="button" className="btn btn-sm btn-success"
                                onClick={() => this.setState({isAddModalOpen: true})}>
                            New member
                        </button>
                    </td>
                </tr>
                {this.state.open && (
                    this.props.group.users.map((c, idx) =>
                            <tr className="nested d-flex">
                                <td className="col-8">
                                    <Link key={idx} to={makeSearchLink("uploader", c, false, '')}>
                                        {c}
                                    </Link>
                                </td>
                                <td className="col-4 align-middle">
                                    <button type="button" className="btn btn-sm btn-danger"
                                            onClick={() => this.setState({isRemoveModalOpen: true, removeUser: c})}>
                                        Remove member
                                    </button>
                                </td>
                            </tr>
                    ))
                }
                {modal}
            </React.Fragment>
        );
    }
}


class UserGroups extends Component {
    state = {
        groups: [],
        error: null,
        success: null
    }

    updateUserGroups = async () => {
        try {
            let response = await api.getUserGroups()
            this.setState({
                groups: response.data.groups
            });
        } catch(error) {
            this.setState({error});
        }
    }

    componentDidMount() {
        this.updateUserGroups()
    }

    handleError = (error) => {
        this.setState({error});
    }

    handleSuccess = (success) => {
        this.setState({success, error: null});
    }

    render() {
        let UserGroupItems = this.state.groups.sort((a, b) => a.name > b.name).map((v) =>
            <UserGroupRow group={v}
                          groupUpdate={this.updateUserGroups}
                          onError={this.handleError}
                          onSuccess={this.handleSuccess}/>
        )
        return (
            <div className="container">
                <View error={this.state.error} success={this.state.success}>
                    {this.state.groups.length ?
                        <table className="table table-bordered table-striped" style={{"border":"1px"}}>
                            <thead>
                                <tr className="d-flex">
                                    <th className="col-8">
                                        Group name
                                    </th>
                                    <th className="col-4">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {UserGroupItems}
                            </tbody>
                        </table>
                        :
                        <h4 className="text-center">You are currently not a member of any group.</h4>
                    }
                </View>
            </div>
        );
    }
}

export default UserGroups;