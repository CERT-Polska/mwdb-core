import React, { Component } from "react";
import api from "../api"

export const GlobalContext = React.createContext();

export class GlobalProvider extends Component {
	constructor(props) {
		super(props)
		this.updateState = this.updateState.bind(this)
		this.state = {
			favorites: [],
			objectSuccess: null,
			objectError: null,
			update: this.updateState,
		}
	}

	updateState(values) {
		this.setState(values)
	}

	getFavorites = async () => {
		try {
    		const response = await api.authGetFavorites();
			this.setState({favorites: response.data.favorites});
    	} catch(error) {
    		console.log(error)
		}
	}

	componentDidMount() {
		if (this.props.isAuthenticated){
			this.getFavorites();
		}
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

