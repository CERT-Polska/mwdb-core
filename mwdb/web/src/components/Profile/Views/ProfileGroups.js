import React from "react";

export default function ProfileGroups({ profile }) {
    return (
        <div>
            <h2>Role groups</h2>
            <p className="lead">
                Role groups are created to give you additional superpowers and enable you to share your objects with
                broader community.
            </p>
            <table className="table table-bordered wrap-table">
                <tbody>
                    <tr><td>Hello</td></tr>
                    <tr><td>Cruel</td></tr>
                    <tr><td>World</td></tr>
                </tbody>
            </table>
            <h2>Workgroups</h2>
            <p className="lead">Workgroups allow you to share objects with other people you trust e.g. members of your organization.</p>
            <p>
                People from the same workgroup:
                <ul>
                    <li>Can check what was uploaded by other workgroup members;</li>
                    <li>Share uploaded object by default when "All my groups" option in Upload was used;</li>
                    <li>Optionally can do basic workgroup management when workgroup administrator rights are given;</li>
                </ul>
            </p>
            <table className="table table-bordered wrap-table">
                <tbody>
                    <tr><td>Hello</td></tr>
                    <tr><td>Cruel</td></tr>
                    <tr><td>World</td></tr>
                </tbody>
            </table>
            <p>
                If you want to have a workgroup with someone, ask repository administrator to create one.
            </p>
        </div>
    );
}
