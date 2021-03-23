import React, { useState } from "react";
import { Link } from "react-router-dom";
import SettingsView from "./SettingsView";

export default function ShowUserProfile(props) {
    const { profile, setProfile } = useState(null);

    return (
        <SettingsView>
            <h4>Account details</h4>
            <table className="table table-striped table-bordered wrap-table">
                <tbody>
                    <tr className="d-flex">
                        <th className="col-2">Login</th>
                        <td className="col-10">
                            {profile.login}
                        </td>
                    </tr>
                    <tr className="d-flex">
                        <th className="col-2">E-mail</th>
                        <td className="col-10">
                            {profile.email}
                        </td>
                    </tr>
                    <tr className="d-flex">
                        <th className="col-2">Registered on</th>
                        <td className="col-10">
                            <DateString
                                date={profile.registered_on}
                            />
                        </td>
                    </tr>
                    <tr className="d-flex">
                        <td className="col-2">Last login</td>
                        <td className="col-10">
                            <DateString
                                date={profile.logged_on}
                            />
                        </td>
                    </tr>
                    <tr className="d-flex">
                        <td className="col-2">Last password set</td>
                        <td className="col-10">
                            <DateString
                                date={profile.set_password_on}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <b>Actions:</b>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <Link className="nav-link" to="/settings/capabilities">
                        Check your capabilities
                    </Link>
                    <Link className="nav-link" to="/settings/reset_password">
                        Request new password
                    </Link>
                </li>
            </ul>
        </SettingsView>
    )
}