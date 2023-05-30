import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@mwdb-web/commons/api";
import { PagedList } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";

import { UserItem } from "../common/UserItem";
import { User } from "@mwdb-web/types/types";

export function UsersListView() {
    const { setAlert } = useViewAlert();
    const [users, setUsers] = useState<User[]>([]);
    const [activePage, setActivePage] = useState<number>(1);
    const [userFilter, setUserFilter] = useState<string>("");

    const query = userFilter.toLowerCase();
    const items = users
        .filter(
            (user) =>
                user.login.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query)
        )
        .sort((userA, userB) => userA.login.localeCompare(userB.login));

    useEffect(() => {
        getUsers();
    }, []);

    async function getUsers() {
        try {
            const response = await api.getUsers();
            setUsers(response.data["users"]);
        } catch (error) {
            setAlert({ error });
        }
    }

    return (
        <div className="container">
            <Link to="/settings/user/new">
                <button type="button" className="btn btn-success">
                    Register user
                </button>
            </Link>
            <PagedList
                listItem={UserItem}
                columnNames={["Login", "E-mail", "Feed quality", "Groups"]}
                items={items.slice((activePage - 1) * 10, activePage * 10)}
                itemCount={items.length}
                activePage={activePage}
                filterValue={userFilter}
                onPageChange={(pageNumber) => setActivePage(pageNumber)}
                onFilterChange={(ev) => {
                    setUserFilter(ev.target.value);
                    setActivePage(1);
                }}
            />
        </div>
    );
}
