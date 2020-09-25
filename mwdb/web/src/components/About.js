import React, {Component} from 'react';
import { connect } from 'react-redux';
import { View } from "@mwdb-web/commons/ui";

import logo from "../assets/logo.png";

const PluginItems = (props) => {
    const { name, info } = props;
    const { active, version, description } = info;

    return(
        <tr>
            <td>{name}{" "}
                {active
                ? <span className="badge badge-success">Active</span>
                : <span className="badge badge-danger">Inactive</span>}
            </td>
            <td>{description}</td>
            <td>{version}</td>
        </tr>
    )
}

class About extends Component {
    render() {
        let plugins = Object.entries(this.props.config["active_plugins"]).sort().map(([key, value]) => (
            <PluginItems
                name={key}
                info = {value}
            />
        ));

        return (
            <div className="align-items-center">
                <div className="jumbotron d-flex align-items-center" style={{backgroundColor: "#101c28", color: "white"}}>
                    <View ident="about">
                        <div className="row justify-content-center">
                            <div className="col-lg-2 col-sm-4 offset-2 text-center">
                                <img src={logo} alt="logo" className="logo-about"/>
                            </div>
                            <div className="col-lg-6 col-sm-4">
                                <h1>mwdb-core</h1>
                                <p>
                                    Powered by CERT.pl<br/>
                                    Version: {this.props.config["server_version"]}<br/>
                                    Try out our <a href="https://pypi.org/project/mwdblib/" style={{color: "lime"}}>mwdblib library</a>!
                                </p>
                            </div>
                        </div>
                    </View>
                </div>
                {plugins.length ?
                    <div className="container">
                        <table className="table table-striped table-bordered wrap-table" >
                            <thead>
                                <tr>
                                    <th>Plugin name</th>
                                    <th>Description</th>
                                    <th>Version</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plugins}
                            </tbody>
                        </table>
                    </div>
                :
                    <p style={{textAlign: "center"}}>No plugins are installed. Visit our <a href="https://github.com/CERT-Polska/mwdb-core/wiki">documentation</a> to learn about MWDB plugins and how they can be used and installed.</p>
                }
            </div>
        );
    }
}

function mapStateToProps(state, ownProps)
{
    return {
        ...ownProps,
        config: state.config.config
    }
}

export default connect(mapStateToProps)(About);
