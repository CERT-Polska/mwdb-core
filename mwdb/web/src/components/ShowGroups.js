import React, { Component } from "react";
import { Link } from "react-router-dom";

import { UserLink } from "./ShowUsers";

import api from "@mwdb-web/commons/api";
import { PagedList, HighlightText, View } from "@mwdb-web/commons/ui";

class ShowGroups extends Component {
    state = {
        groups: [],
        activePage: 1,
        groupFilter: "",
    };

    handlePageChange = (pageNumber) => {
        this.setState({ activePage: pageNumber });
    };

    handleFilterChange = (ev) => {
        const target = ev.target;
        this.setState({ groupFilter: target.value, activePage: 1 });
    };

    async componentDidMount() {
        this.setState({ groupFilter: "", activePage: 1 });
        try {
            let response = await api.getGroups();
            this.setState({
                groups: response.data.groups,
            });
        } catch (error) {
            this.setState({ error });
        }
    }

    get items() {
        return this.state.groups
            .filter((f) => !f.private)
            .filter((f) =>
                f.name
                    .toLowerCase()
                    .includes(this.state.groupFilter.toLowerCase())
            )
            .sort((a, b) => a.name > b.name);
    }

    render() {
        return (
            <View fluid error={this.state.error}>
                <Link to="/groups/new">
                    <button type="button" className="btn btn-success">
                        Create group
                    </button>
                </Link>
                <PagedList
                    listItem={GroupItem}
                    columnNames={["Name", "Members"]}
                    items={this.items.slice(
                        (this.state.activePage - 1) * 10,
                        this.state.activePage * 10
                    )}
                    itemCount={this.items.length}
                    activePage={this.state.activePage}
                    filterValue={this.state.groupFilter}
                    onPageChange={this.handlePageChange}
                    onFilterChange={this.handleFilterChange}
                />
            </View>
        );
    }
}

function GroupItem(props) {
    return (
        <tr key={props.name}>
            <td style={{ textAlign: "left" }}>
                <Link to={`/group/${props.name}`}>
                    <HighlightText filterValue={props.filterValue}>
                        {props.name}
                    </HighlightText>
                </Link>
            </td>
            <td>
                {props.name === "public"
                    ? "(Group is public and contains all members)"
                    : props.users.map((c, idx) => [
                          <UserLink key={idx} login={c} />,
                          idx + 1 < props.users.length ? <span>,</span> : "",
                      ])}
            </td>
        </tr>
    );
}

export function GroupLink(props) {
    return <Link to={`/group/${props.name}`}>{props.name}</Link>;
}

export default ShowGroups;
