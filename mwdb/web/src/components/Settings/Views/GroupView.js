import React, { useCallback, useEffect, useState } from "react";
import { useParams, Switch, Link, useLocation } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { AdministrativeRoute, useViewAlert } from "@mwdb-web/commons/ui";

import GroupDetails from "./GroupDetails";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";
import GroupMembers from "./GroupMembers";

export default function GroupView() {
    const location = useLocation();
    const { setAlert } = useViewAlert();
    const { name } = useParams();
    const [group, setGroup] = useState({});

    async function updateGroup() {
        try {
            const response = await api.getGroup(name);
            setGroup(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getGroup = useCallback(updateGroup, [name, setAlert]);

    useEffect(() => {
        getGroup();
    }, [getGroup]);

    if (!group) return [];

    return (
        <div className="container">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <strong>Group details: </strong>
                        {location.pathname.split("/").length > 4 ? (
                            <Link to={`/settings/group/${group.name}`}>
                                {group.name}
                            </Link>
                        ) : (
                            <span>{group.name}</span>
                        )}
                    </li>
                    {location.pathname.split("/").length > 4 && (
                        <li className="breadcrumb-item active">
                            <Switch>
                                <AdministrativeRoute path="/settings/group/:name/capabilities">
                                    Capabilities
                                </AdministrativeRoute>
                                <AdministrativeRoute path="/settings/group/:name/members">
                                    Members
                                </AdministrativeRoute>
                            </Switch>
                        </li>
                    )}
                </ol>
            </nav>
            <Switch>
                <AdministrativeRoute exact path="/settings/group/:name">
                    <GroupDetails group={group} updateGroup={getGroup} />
                </AdministrativeRoute>
                <AdministrativeRoute
                    exact
                    path="/settings/group/:name/capabilities"
                >
                    <ProfileCapabilities profile={group} />
                </AdministrativeRoute>
                <AdministrativeRoute exact path="/settings/group/:name/members">
                    <GroupMembers group={group} getGroup={updateGroup} />
                </AdministrativeRoute>
            </Switch>
        </div>
    );
}
