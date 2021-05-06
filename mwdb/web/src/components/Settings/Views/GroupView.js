import React, { useCallback, useEffect, useState } from "react";
import {
    useHistory,
    useParams,
    Switch,
    Link,
    useLocation,
} from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { AdministrativeRoute, getErrorMessage } from "@mwdb-web/commons/ui";

import GroupDetails from "./GroupDetails";
import ProfileCapabilities from "../../Profile/Views/ProfileCapabilities";

export default function GroupView() {
    const location = useLocation();
    const history = useHistory();
    const { name } = useParams();
    const [group, setGroup] = useState({});
    console.log(name);
    async function updateGroup() {
        try {
            const response = await api.getGroup(name);
            setGroup(response.data);
        } catch (error) {
            history.push({
                pathname: `/admin/group/${group.name}`,
                state: { error: getErrorMessage(error) },
            });
        }
    }

    const getGroup = useCallback(updateGroup, [name]);

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
                            <Link to={`/admin/group/${group.name}`}>
                                {group.name}
                            </Link>
                        ) : (
                            <span>{group.name}</span>
                        )}
                    </li>
                    {location.pathname.split("/").length > 4 && (
                        <li className="breadcrumb-item active">
                            <Switch>
                                <AdministrativeRoute path="/admin/group/:name/capabilities">
                                    Capabilities
                                </AdministrativeRoute>
                                <AdministrativeRoute path="/admin/group/:name/members">
                                    Members
                                </AdministrativeRoute>
                            </Switch>
                        </li>
                    )}
                </ol>
            </nav>
            <Switch>
                <AdministrativeRoute exact path="/admin/group/:name">
                    <GroupDetails group={group} getGroup={updateGroup} />
                </AdministrativeRoute>
                <AdministrativeRoute
                    exact
                    path="/admin/group/:name/capabilities"
                >
                    <ProfileCapabilities profile={group} />
                </AdministrativeRoute>
                <AdministrativeRoute exact path="/admin/group/:name/members">
                    {/*    group members component */}
                </AdministrativeRoute>
            </Switch>
        </div>
    );
}
