import React, { Component } from "react";

export const GlobalContext = React.createContext();

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

	componentDidUpdate(prevProps) {
    	if(this.props !== prevProps) {
    		this.setState({favorites: this.props.favorites});
    	}
    }

	render() {
        return (
            <GlobalContext.Provider value={this.state}>
                {this.props.children}
            </GlobalContext.Provider>
        )
    }
}

