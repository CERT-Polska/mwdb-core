import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import {
    LimitTo,
    UserBadge,
    PagedList,
    HighlightText,
    useViewAlert,
} from "@mwdb-web/commons/ui";

function GroupItem(props) {
    return (
        <tr key={props.name}>
            <td>
                <Link to={`/settings/group/${props.name}`}>
                    <HighlightText filterValue={props.filterValue}>
                        {props.name}
                    </HighlightText>
                </Link>
            </td>
            <td>
                {props.name === "public" ? (
                    "(Group is public and contains all members)"
                ) : (
                    <LimitTo count={5}>
                        {props.users.map((login) => (
                            <UserBadge
                                user={{ login }}
                                clickable
                                basePath="/settings"
                            />
                        ))}
                    </LimitTo>
                )}
            </td>
        </tr>
    );
}

export default function GroupsList() {
    const { setAlert } = useViewAlert();
    const [groups, setGroups] = useState([]);
    const [activePage, setActivePage] = useState(1);
    const [groupFilter, setGroupFilter] = useState("");

    async function updateGroups() {
        try {
            const response = await api.getGroups();
            setGroups(response.data["groups"]);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getGroups = useCallback(updateGroups, [setAlert]);

    useEffect(() => {
        getGroups();
    }, [getGroups]);

    const query = groupFilter.toLowerCase();
    const items = groups
        .filter((group) => !group.private)
        .filter((group) => group.name.toLowerCase().includes(query))
        .sort((groupA, groupB) => groupA.name.localeCompare(groupB.name));

    return (
        <div className="container">
            <Link to="/settings/group/new">
                <button type="button" className="btn btn-success">
                    Create group
                </button>
            </Link>
            <PagedList
                listItem={GroupItem}
                columnNames={["Name", "Members"]}
                items={items.slice((activePage - 1) * 10, activePage * 10)}
                itemCount={items.length}
                activePage={activePage}
                filterValue={groupFilter}
                onPageChange={(pageNumber) => setActivePage(pageNumber)}
                onFilterChange={(ev) => {
                    setGroupFilter(ev.target.value);
                    setActivePage(1);
                }}
            />
        </div>
    );
}
