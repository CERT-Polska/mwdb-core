import React, { Component } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { DateString, SortedList, View } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { useRemote } from "@mwdb-web/commons/remotes";

function ConfigStatsItem(props) {
    const remote = useRemote();
    const remotePath = remote ? `remote/${remote}` : "";
    return (
        <tr>
            <td>
                <Link
                    to={makeSearchLink(
                        "family",
                        props.family,
                        false,
                        `${remotePath}/configs`
                    )}
                >
                    {props.family}
                </Link>
            </td>
            <td>
                <DateString date={props.last_upload} />
            </td>
            <td>{props.count}</td>
        </tr>
    );
}

class ConfigStats extends Component {
    state = {
        families: [],
        sortOrder: [0, 1],
        filterValue: "*",
    };

    async updateStats() {
        try {
            let response = await api.getConfigStats(this.state.filterValue);
            this.setState({ families: response.data.families });
        } catch (error) {
            this.setState({ error });
        }
    }

    componentDidMount = () => {
        this.updateStats();
    };

    get items() {
        let columns = ["family", "last_upload", "count"];
        let sortCriterion = columns[this.state.sortOrder[0]];
        let sortOrder = this.state.sortOrder[1];

        return this.state.families.sort((a, b) => {
            if (a[sortCriterion] < b[sortCriterion]) return -sortOrder;
            if (a[sortCriterion] > b[sortCriterion]) return sortOrder;
            return 0;
        });
    }

    onSort = (sortOrder) => {
        this.setState({ sortOrder });
    };

    onChangeFilter = (ev) => {
        let value = ev.target.value;
        this.setState({ filterValue: value }, () => this.updateStats());
    };

    render() {
        return (
            <View ident="configStats" error={this.state.error}>
                <h2>Global family statistics</h2>
                <div>
                    Show stats from:
                    <select
                        className="custom-select"
                        value={this.state.filterValue}
                        onChange={this.onChangeFilter}
                    >
                        <option value="*">all time</option>
                        <option value="24h">last 24 hours</option>
                        <option value="72h">last 72 hours</option>
                        <option value="7d">last 7 days</option>
                        <option value="30d">last 30 days</option>
                        <option value="90d">last 90 days</option>
                    </select>
                </div>
                <SortedList
                    listItem={ConfigStatsItem}
                    items={this.items}
                    columnNames={["Family", "Last upload", "Unique configs"]}
                    sortOrder={this.state.sortOrder}
                    onSort={this.onSort}
                />
            </View>
        );
    }
}

export default ConfigStats;
