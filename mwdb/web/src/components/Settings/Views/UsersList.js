import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import {
    GroupBadge,
    PagedList,
    HighlightText,
    LimitTo,
    useViewAlert,
} from "@mwdb-web/commons/ui";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRobot } from "@fortawesome/free-solid-svg-icons";

function UserItem(props) {
    let groups = props.groups.filter((c) => c.name !== "public");
    let feed_badge = (
        <span className="badge badge-secondary">
            <FontAwesomeIcon icon={faUser} size="xs" /> {props.feed_quality}
        </span>
    );

    if (props.feed_quality === "low") {
        feed_badge = (
            <span className="badge badge-danger">
                <FontAwesomeIcon icon={faRobot} size="xs" />{" "}
                {props.feed_quality}
            </span>
        );
    }

    return (
        <tr key={props.login}>
            <td>
                <Link to={`/settings/user/${props.login}`}>
                    <HighlightText filterValue={props.filterValue}>
                        {props.login}
                    </HighlightText>
                </Link>
                {props.disabled ? (
                    <span className="badge badge-danger">blocked</span>
                ) : (
                    []
                )}
            </td>
            <td>
                <a href={`mailto:${props.email}`}>
                    <HighlightText filterValue={props.filterValue}>
                        {props.email}
                    </HighlightText>
                </a>
            </td>
            <td>{feed_badge}</td>
            <td>
                <LimitTo count={5}>
                    {groups
                        .filter((group) => group.name !== props.login)
                        .map((group) => (
                            <GroupBadge
                                group={group}
                                clickable
                                basePath="/settings"
                            />
                        ))}
                </LimitTo>
            </td>
        </tr>
    );
}

export default function UsersList() {
    const { setAlert } = useViewAlert();
    const [users, setUsers] = useState([]);
    const [activePage, setActivePage] = useState(1);
    const [userFilter, setUserFilter] = useState("");

    async function updateUsers() {
        try {
            const response = await api.getUsers();
            setUsers(response.data["users"]);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getUsers = useCallback(updateUsers, [setAlert]);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    const query = userFilter.toLowerCase();
    const items = users
        .filter(
            (user) =>
                user.login.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
        )
        .sort((userA, userB) => userA.login.localeCompare(userB.login));

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
