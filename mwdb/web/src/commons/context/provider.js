import React, { Component } from "react";
import {GlobalContext} from "./index";
import api from "../api"

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

	getFavorites = async () => {
    	try {
    		const response = await api.authGetFavorites()
			this.setState({favorites: response.data.favorites})
		} catch(error) {
    		console.log(error)
		}
	}

	componentDidMount() {
    	this.getFavorites()
	}

	render() {
        return (
            <GlobalContext.Provider value={this.state}>
                {this.props.children}
            </GlobalContext.Provider>
        )
    }
}

