import React, {Component} from 'react';
import { connect } from "react-redux";
import api from "@mwdb-web/commons/api";
import { View } from "@mwdb-web/commons/ui";
import SwaggerUI from "swagger-ui-react";


class Docs extends Component {
    state = {}
    
    async componentDidMount() 
    {
        let spec = await api.getServerDocs();
        /*
            Server variables doesn't work well in swagger-ui-react.
            And hey... we probably don't want to make it customizable here
        */
        spec.data["servers"] = [{
            "url": new URL("/", document.baseURI).href,
            "description": 'MWDB API endpoint',
        }]
        this.setState({
            spec: spec.data
        });
    }

    render() {
        return (
            <View ident="docs">
                <SwaggerUI spec={this.state.spec}
                           url=""
                           docExpansion='list'
                           onComplete={swagger => {
                              swagger.preauthorizeApiKey('bearerAuth', this.props.userToken);
                           }}/>
            </View>
        );
    }
}


function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        userToken: state.auth.loggedUser && state.auth.loggedUser.token
    }
}


export default connect( mapStateToProps )(Docs);
