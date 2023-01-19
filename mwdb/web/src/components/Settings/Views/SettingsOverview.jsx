import React, { useCallback, useContext, useEffect, useState } from "react";

import api from "@mwdb-web/commons/api";
import { ConfigContext } from "@mwdb-web/commons/config";
import { useViewAlert } from "@mwdb-web/commons/ui";

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

export default function SettingsOverview() {
    const config = useContext(ConfigContext);
    const { setAlert } = useViewAlert();
    const [extendedInfo, setExtendedInfo] = useState();

    async function updateExtendedInfo() {
        try {
            const response = await api.getServerAdminInfo();
            setExtendedInfo(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    function FlagBadge({ enabled }) {
        return enabled ? (
            <span className="badge badge-success">enabled</span>
        ) : (
            <span className="badge badge-danger">disabled</span>
        );
    }

    const getExtendedInfo = useCallback(updateExtendedInfo, [setAlert]);

    useEffect(() => {
        getExtendedInfo();
    }, [getExtendedInfo]);

    if (!extendedInfo) return [];

    const plugins = Object.entries(extendedInfo["active_plugins"])
        .sort()
        .map(([key, value]) => <PluginItems name={key} info={value} />);

    return (
        <div className="container">
            <h2>Overview</h2>
            <p className="lead">
                Basic overview of MWDB Core general settings. Specific features
                can be enabled in configuration file or using environment
                variables.
            </p>
            <h5>Feature set</h5>
            <table className="table table-bordered wrap-table">
                <tbody>
                    <tr>
                        <th className="col-2">Server version</th>
                        <td>
                            <span className="badge badge-primary">
                                {config.config["server_version"]}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <th>User registration</th>
                        <td>
                            <FlagBadge
                                enabled={
                                    config.config["is_registration_enabled"]
                                }
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>Rate limits</th>
                        <td>
                            <FlagBadge
                                enabled={extendedInfo["rate_limit_enabled"]}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>Karton integration</th>
                        <td>
                            <FlagBadge
                                enabled={config.config["is_karton_enabled"]}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>Maintenance mode</th>
                        <td>
                            <FlagBadge
                                enabled={config.config["is_maintenance_set"]}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>Plugins</th>
                        <td>
                            <FlagBadge
                                enabled={extendedInfo["plugins_enabled"]}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <h5>Active plugins</h5>
            {plugins.length ? (
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
            ) : (
                <p>
                    No plugins are installed. Visit our{" "}
                    <a href="https://mwdb.readthedocs.io/">documentation</a> to
                    learn about MWDB plugins and how they can be used and
                    installed.
                </p>
            )}
        </div>
    );
}
