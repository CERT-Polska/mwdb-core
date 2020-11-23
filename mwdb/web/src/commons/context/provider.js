import React, { Component } from "react";
import {GlobalContext} from "./index";
import { connect } from "react-redux";


export class GlobalProvider extends Component {
    constructor(props) {
		super(props)
		this.updateState = this.updateState.bind(this)
		this.state = {
			favorites: this.props.favorites,
			update: this.updateState
		}
	}

	updateState(values) {
		this.setState(values)
	}

	render() {
    	console.log(this.props.favorites)
        return (
            <GlobalContext.Provider value={this.state}>
                {this.props.children}
            </GlobalContext.Provider>
        )
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        favorites: state.auth.loggedUser ? state.auth.loggedUser.favorites : [],
    }
}

export default connect(mapStateToProps)(GlobalProvider);