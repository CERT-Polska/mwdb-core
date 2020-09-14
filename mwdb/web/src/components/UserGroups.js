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
                <tr>
                    <th style={{cursor: 'pointer'}} onClick={this._toggle.bind(this)}>
                        <FontAwesomeIcon icon={this.state.open ? "minus" : "plus"} size="sm"/>
                        {" "}
                        <Link to={`/group/${this.props.group.name}`}>
                            <HighlightText>{this.props.group.name}</HighlightText>
                        </Link>
                    </th>

                            <td>
                                {this.props.group.users.map((c, idx) => [
                                    <Link key={idx} to={makeSearchLink("uploader", c, false, '')}>
                                        {c}
                                    </Link>,
                                    idx+1 < this.props.group.users.length ? <span>,</span> : ""])
                                }
                            </td>
                </tr>
                {this.state.open && (
                    this.props.group.users.map((c, idx) =>
                            <tr className="nested">
                                <td colSpan="2">
                                    <Link key={idx} to={makeSearchLink("uploader", c, false, '')}>
                                        {c}
                                    </Link>
                                    {/*<UserLink key={idx} login={c}/>*/}
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
            <div className="container-fluid">
                <ErrorBoundary error={this.state.error}>
                    {this.state.groups.length ?
                        <table className="table table-striped table-bordered wrap-table">
                            <thead>
                                <tr>
                                    <th>
                                        Group name
                                    </th>
                                    <th>
                                        Members
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