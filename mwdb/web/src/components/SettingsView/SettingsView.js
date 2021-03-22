import React from "react";

import { View } from "@mwdb-web/commons/ui";

export default function SettingsView(props) {
    return (
        <View ident="recentObjects">
            <div className="row">
                <div className="col-3">
                    <strong>Profile settings</strong>
                    <div className="nav flex-column nav-pills">
                        <a href="#e" className="nav-link active">Account</a>
                        <a href="#e" className="nav-link">Groups</a>
                        <a href="#e" className="nav-link">API keys</a>
                    </div>
                    <hr/>
                    <strong>Administration</strong>
                    <div className="nav flex-column nav-pills">
                        <a href="#e" className="nav-link">Pending registrations</a>
                        <a href="#e" className="nav-link">Capabilities</a>
                        <a href="#e" className="nav-link">User settings</a>
                        <a href="#e" className="nav-link">Group settings</a>
                        <a href="#e" className="nav-link">Attribute settings</a>
                    </div>
                </div>
                <div className="col-9">
                    <div className="tab-content">
                        <h4>Account details</h4>
                        <table className="table table-striped table-bordered wrap-table">
                        <tbody>
                            <tr className="d-flex">
                                <th className="col-2">Login</th>
                                <td className="col-10">
                                    admin
                                </td>
                            </tr>
                            <tr className="d-flex">
                                <th className="col-2">E-mail</th>
                                <td className="col-10">
                                    admin@admin.com
                                </td>
                            </tr>
                            <tr className="d-flex">
                                <th className="col-2">Registered</th>
                                <td className="col-10">
                                    nowhere
                                </td>
                            </tr>
                        </tbody>
                        </table>
                    </div>
                    <b>Actions:</b>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a className="nav-link" href="#">Check your capabilities</a>
                            <a className="nav-link" href="#">Request new password</a>
                        </li>
                    </ul>
                </div>
            </div>
        </View>
    )
}