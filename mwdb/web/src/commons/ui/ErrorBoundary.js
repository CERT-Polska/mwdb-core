import React, {Component} from 'react';

import { intersperse } from '../helpers';

function getErrorMessage(error) {
    if(error.response)
    {
        if(error.response.data.message)
        {
            return error.response.data.message
        }
        if(error.response.data.errors)
        {
            let messages = Object.keys(error.response.data.errors).map(key => {
                if(key === "_schema")
                    return error.response.data.errors[key]
                else
                    return `${key}: ${error.response.data.errors[key]}`
            });
            return intersperse(messages, <br/>)
        }
    }
    return error.toString();
}

export function Alert(props) {
    if(props.error) {
        return <div className="alert alert-danger">{getErrorMessage(props.error)}</div>
    } else if(props.success) {
        return <div className="alert alert-success">{props.success}</div>
    } else if(props.warning) {
        return <div className="alert alert-warning">{props.warning}</div>
    }
    return <div/>
}

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);

        let error = props.error;

        if (!error) {
            error = null;
        }

        this.state = {error: error};
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.error !== this.state.error) {
            this.setState({"error": this.props.error});
        }
    }

    componentDidCatch(error, info) {
        this.setState({error: error});
    }

    render() {
        if (this.state.error) {
            // You can render any custom fallback UI
            return <div className="container-fluid">
                <Alert error={this.state.error}/>
            </div>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
