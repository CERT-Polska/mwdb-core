import React, {Component} from 'react';
import {Link} from 'react-router-dom';

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { authActions } from "@mwdb-web/commons/auth";
import { Extension } from "@mwdb-web/commons/extensions";
import { View } from "@mwdb-web/commons/ui";


class UserLogin extends Component {
    state = {
        login: '',
        password: ''
    };

    handleInputChange = (event) => {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.props.auth.login(this.state.login, this.state.password, this.props.prevLocation);
    }

    render() {
        let {error, success} = this.props.location.state || {};
        return (
            <View ident="userLogin" error={error} success={success}>
                <h2>Login</h2>
                <form onSubmit={this.handleSubmit}>
                    <Extension ident="userLoginNote" />
                    <div className="form-group">
                        <label>Login</label>
                        <input type="text" name="login" value={this.state.login} onChange={this.handleInputChange}
                               className="form-control" required/>
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" value={this.state.password}
                               onChange={this.handleInputChange} className="form-control" required/>
                    </div>
                    <nav className="form-group">
                        <Link to={'/recover_password'}>
                        Forgot password?
                        </Link>
                    </nav>
                    <input type="submit" value="Submit" className="btn btn-primary"/>
                </form>
            </View>
        );
    }
}

function mapStateToProps(state) {
    return {
        prevLocation: state.auth.prevLocation
    }
}

function mapDispatchToProps(dispatch) {
    return {
        auth: bindActionCreators(authActions, dispatch)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserLogin);
