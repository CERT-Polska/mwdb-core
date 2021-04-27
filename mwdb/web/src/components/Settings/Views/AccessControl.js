import React, { useState, useCallback, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { capabilitiesList } from "@mwdb-web/commons/auth";
import { intersperse } from "@mwdb-web/commons/helpers";
import { GroupBadge, ShowIf } from "@mwdb-web/commons/ui";

function GroupAppliesTo({ group }) {
    if (group["name"] === "public")
        return (
            <small className="text-muted">
                Applies to all users in MWDB system
            </small>
        );
    return (
        <div>
            <small className="text-muted">
                Applies to{" "}
                {intersperse(
                    group["users"]
                        .slice(0, 3)
                        .map((user) => (
                            <Link to={`/admin/user/{user}`}>{user}</Link>
                        )),
                    ", "
                )}
                {group["users"].length > 3
                    ? ` and ${group["users"].length - 3}  more...`
                    : []}
            </small>
        </div>
    );
}

function CapabilitiesHeader({ group }) {
    return (
        <tr className="bg-light">
            <th colSpan="2" className="col">
                <GroupBadge group={group} />
                <ShowIf condition={!group["private"]}>
                    <GroupAppliesTo group={group} />
                </ShowIf>
            </th>
        </tr>
    );
}

function CapabilitiesList({ capabilities }) {
    return capabilities.map((cap) => (
        <tr>
            <th className="col-1">
                <span className="badge badge-success">{cap}</span>
            </th>
            <td className="col">
                {capabilitiesList[cap] || "(no description)"}
            </td>
        </tr>
    ));
}

export default function AccessControl() {
    const history = useHistory();
    const [groups, setGroups] = useState(null);

    async function updateGroups() {
        try {
            const response = await api.getGroups();
            const groupList = response.data["groups"].sort(
                (a, b) =>
                    (b["name"] === "public") - (a["name"] === "public") ||
                    a["private"] - b["private"] ||
                    a["name"].localeCompare(b["name"])
            );
            setGroups(groupList);
        } catch (error) {
            console.error(error);
        }
    }
    const getGroups = useCallback(updateGroups, []);

    useEffect(() => {
        getGroups();
    }, [getGroups]);

    console.log(groups);

    if (!groups) return [];

    return (
        <div>
            <table className="table table-bordered wrap-table">
                <tbody>
                    {groups
                        .filter((group) => group.capabilities.length > 0)
                        .map((group) => [
                            <CapabilitiesHeader group={group} />,
                            <CapabilitiesList
                                capabilities={group.capabilities}
                            />,
                        ])}
                </tbody>
            </table>
        </div>
    );
}
