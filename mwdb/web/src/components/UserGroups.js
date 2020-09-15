import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import {makeSearchLink} from "@malwarefront/helpers";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import api from "@malwarefront/api";
import { ErrorBoundary, HighlightText } from "@malwarefront/ui";

class UserGroupRow extends Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false,
        }
    }

    _toggle() {
        this.setState({
            open: !this.state.open
        })
    }

    render(){
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
                        <button type="button" className="btn btn-sm btn-success">
                                    Add member
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
                                    <button type="button" className="btn btn-sm btn-danger">
                                        Remove member
                                    </button>
                                </td>
                            </tr>
                    ))
                }
            </React.Fragment>
        );
    }
}


class UserGroups extends Component {
    state = {
        groups: []
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

    render() {
        let UserGroupItems = this.state.groups.sort((a, b) => a.name > b.name).map((v) =>
                <UserGroupRow group ={v}/>
        )
        return (
            <div className="container">
                <ErrorBoundary error={this.state.error}>
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
                </ErrorBoundary>
            </div>
        );
    }
}

export default UserGroups;