import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import Hash from "./Hash";

import { connect } from "react-redux";
import { mapObjectType } from "@malwarefront/helpers";

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

        return (
            <React.Fragment>
                { this.props.diffWith 
                    ? (
                        <Link to={`/diff/${this.props.id}/${this.props.diffWith}`}>
                            <button target="_self" className="btn btn-primary" style={{marginRight: "8pt"}}>
                                <FontAwesomeIcon icon="random" pull="left" size="x"/>
                            </button>
                        </Link>
                    ) : []}
                {linkElement}
            </React.Fragment>
        );
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
