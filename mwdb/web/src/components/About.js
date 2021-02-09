import React, { useContext } from "react";

import { ConfigContext } from "@mwdb-web/commons/config";
import { View } from "@mwdb-web/commons/ui";

import logo from "../assets/logo.png";

function PluginItems(props) {
    const { name, info } = props;
    const { active, version, description } = info;

    return (
        <tr>
            <td>
                {name}{" "}
                {active ? (
                    <span className="badge badge-success">Active</span>
                ) : (
                    <span className="badge badge-danger">Inactive</span>
                )}
            </td>
            <td>{description}</td>
            <td>{version}</td>
        </tr>
    );
}

export default function About() {
    const config = useContext(ConfigContext);
    let plugins = Object.entries(config.config["active_plugins"])
        .sort()
        .map(([key, value]) => <PluginItems name={key} info={value} />);

    return (
        <div className="align-items-center">
            <div
                className="jumbotron d-flex align-items-center"
                style={{ backgroundColor: "#101c28", color: "white" }}
            >
                <View ident="about">
                    <div className="row justify-content-center">
                        <div className="col-lg-2 col-sm-4 offset-2 text-center">
                            <img src={logo} alt="logo" className="logo-about" />
                        </div>
                        <div className="col-lg-6 col-sm-4">
                            <h1>mwdb-core</h1>
                            <p>
                                Powered by CERT.pl
                                <br />
                                Version: {config.config["server_version"]}
                                <br />
                                Try out our{" "}
                                <a
                                    href="https://pypi.org/project/mwdblib/"
                                    style={{ color: "lime" }}
                                >
                                    mwdblib library
                                </a>
                                !
                            </p>
                        </div>
                    </div>
                </View>
            </div>
            {plugins.length ? (
                <div className="container">
                    <table className="table table-striped table-bordered wrap-table">
                        <thead>
                            <tr>
                                <th>Plugin name</th>
                                <th>Description</th>
                                <th>Version</th>
                            </tr>
                        </thead>
                        <tbody>{plugins}</tbody>
                    </table>
                </div>
            ) : (
                <p style={{ textAlign: "center" }}>
                    No plugins are installed. Visit our{" "}
                    <a href="https://mwdb.readthedocs.io/">documentation</a> to
                    learn about MWDB plugins and how they can be used and
                    installed.
                </p>
            )}
        </div>
    );
}
