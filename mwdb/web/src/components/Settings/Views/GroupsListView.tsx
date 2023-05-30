import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@mwdb-web/commons/api";
import { PagedList } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { GroupItem, Props as GroupItemProps } from "../common/GroupItem";

export function GroupsListView() {
    const { setAlert } = useViewAlert();
    const [groups, setGroups] = useState<GroupItemProps[]>([]);
    const [activePage, setActivePage] = useState<number>(1);
    const [groupFilter, setGroupFilter] = useState<string>("");

    const query = groupFilter.toLowerCase();
    const items = groups
        .filter((group) => !group.private)
        .filter((group) => group.name.toLowerCase().includes(query))
        .sort((groupA, groupB) => groupA.name.localeCompare(groupB.name));

    useEffect(() => {
        getGroups();
    }, []);

    async function getGroups() {
        try {
            const response = await api.getGroups();
            setGroups(response.data.groups);
        } catch (error) {
            setAlert({ error });
        }
    }

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
