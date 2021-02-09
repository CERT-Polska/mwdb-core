import identicon from "identicon.js";
import React, { Component } from "react";

import sha1 from "sha1";

class Identicon extends Component {
    constructor(props) {
        super(props);
        this.state = {
            identicon: "",
        };
    }

    updateState = () => {
        if (
            typeof this.props.data === "undefined" &&
            typeof this.props.hash === "undefined"
        )
            return;
        let data = this.props.hash || sha1(this.props.data);
        let options = {
            margin: parseInt(this.props.margin, 10) || 0.08,
            size: parseInt(this.props.size, 10),
            format: "svg",
        };
        let ident = new identicon(data, options).toString();

        this.setState({
            identicon: "data:image/svg+xml;base64," + ident,
        });
    };

    componentDidUpdate = (prevProps, prevState) => {
        if (this.props !== prevProps) this.updateState();
    };

    componentDidMount = () => {
        this.updateState();
    };

    render() {
        return (
            <img
                className="identicon"
                src={this.state.identicon}
                alt="identicon"
                style={this.props.style}
            />
        );
    }
}

export default Identicon;
