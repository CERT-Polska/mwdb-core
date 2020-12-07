import React, { Component } from "react";

export const GlobalContext = React.createContext();

export class GlobalProvider extends Component {
    constructor(props) {
        super(props)
        this.updateState = this.updateState.bind(this)
        this.state = {
            object: {
                favorite: false,
                success: null,
                error: null,
            },
            update: this.updateState,
        }
    }

    updateState(values) {
        this.setState(values)
    }

    render() {
        return (
            <GlobalContext.Provider value={this.state}>
                {this.props.children}
            </GlobalContext.Provider>
        )
    }
}
