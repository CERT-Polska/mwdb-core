import React, { Component } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { PagedList, View, HighlightText } from "@mwdb-web/commons/ui";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRobot } from "@fortawesome/free-solid-svg-icons";

class ShowUsers extends Component {
    state = {
        users: [],
        activePage: 1,
        userFilter: "",
    };

    handlePageChange = (pageNumber) => {
        this.setState({ activePage: pageNumber });
    };

    handleFilterChange = (ev) => {
        const target = ev.target;
        this.setState({ userFilter: target.value, activePage: 1 });
    };

    async componentDidMount() {
        this.setState({ userFilter: "", activePage: 1 });
        try {
            let response = await api.getUsers();
            this.setState({ users: response.data.users });
        } catch (error) {
            this.setState({ error });
        }
    }

    userMatchesFilter = (user) => {
        let query = this.state.userFilter.toLowerCase();
        return (
            user.login.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    };

    get items() {
        return this.state.users.filter(this.userMatchesFilter).sort((a, b) => {
            if (a.login > b.login) return 1;
            if (a.login < b.login) return -1;
            return 0;
        });
    }

    render() {
        return (
            <View fluid ident="showUsers" error={this.state.error}>
                <Link to="/users/new">
                    <button type="button" className="btn btn-success">
                        Register user
                    </button>
                </Link>
                <PagedList
                    listItem={UserItem}
                    columnNames={["Login", "E-mail", "Feed quality", "Groups"]}
                    items={this.items.slice(
                        (this.state.activePage - 1) * 10,
                        this.state.activePage * 10
                    )}
                    itemCount={this.items.length}
                    activePage={this.state.activePage}
                    filterValue={this.state.userFilter}
                    onPageChange={this.handlePageChange}
                    onFilterChange={this.handleFilterChange}
                />
            </View>
        );
    }
}

export function UserLink(props) {
    return (
        <Link to={`/user/${props.login}`}>
            <HighlightText filterValue={props.filterValue}>
                {props.login}
            </HighlightText>
        </Link>
    );
}

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
            <td key="login" style={{ textAlign: "left" }}>
                <UserLink {...props} />
            </td>
            <td key="e-mail">
                <a href={`mailto:${props.email}`}>
                    <HighlightText filterValue={props.filterValue}>
                        {props.email}
                    </HighlightText>
                </a>
            </td>
            <td key="feed-quality">{feed_badge}</td>
            <td key="groups">
                {groups.map((c, idx) => [
                    <Link key={c.name} to={`/group/${c.name}`}>
                        {c.name}
                    </Link>,
                    idx + 1 < groups.length ? (
                        <span key={`comma-${idx}`}>, </span>
                    ) : (
                        ""
                    ),
                ])}
            </td>
        </tr>
    );
}

export default ShowUsers;
