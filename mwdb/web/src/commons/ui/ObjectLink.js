import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import Hash from "./Hash";

import { connect } from "react-redux";
import { mapObjectType } from "../helpers";

class ObjectLink extends Component {
    render() {
        let objectType = mapObjectType(this.props.type);

        let linkElement = (
            <Link to={`/${objectType}/${this.props.id}`} className={this.props.className}>
                {this.props.type === "user" || this.props.type === "group" ? this.props.id : <Hash hash={this.props.id} inline={this.props.inline}/>}
            </Link>
        )

        if(!this.props.isAdmin && (objectType === "user" || objectType === "group"))
        {
            linkElement = <span>{this.props.id}</span>
        }

        return linkElement;
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        isAdmin: state.auth.loggedUser && state.auth.loggedUser.capabilities.indexOf("manage_users") >= 0,
    }
}

export default connect(mapStateToProps)(ObjectLink);
