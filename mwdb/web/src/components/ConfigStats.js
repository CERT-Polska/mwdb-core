import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { DateString, SortedList, View } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { useRemotePath } from "@mwdb-web/commons/remotes";

function ConfigStatsItem(props) {
    const remotePath = useRemotePath();
    return (
        <tr>
            <td>
                <Link
                    to={makeSearchLink({
                        field: "family",
                        value: props.family,
                        pathname: `${remotePath}/configs`,
                    })}
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

export default function ConfigStats() {
    const [families, setFamilies] = useState([]);
    const [sortOrder, setSortOrder] = useState([0, 1]);
    const [filterValue, setFilterValue] = useState("*");
    const [error, setError] = useState("");
    const didMount = useRef(false);

    async function updateStats() {
        try {
            let response = await api.getConfigStats(filterValue);
            setFamilies(response.data.families);
        } catch (error) {
            setError(error);
        }
    }

    const items = () => {
        let columns = ["family", "last_upload", "count"];
        let sortCriterion = columns[sortOrder[0]];
        let sortOrderVariable = sortOrder[1];

        return families.sort((a, b) => {
            if (a[sortCriterion] < b[sortCriterion]) return -sortOrderVariable;
            if (a[sortCriterion] > b[sortCriterion]) return sortOrderVariable;
            return 0;
        });
    };

    const onSort = (sortOrder) => {
        setSortOrder(sortOrder);
    };

    const onChangeFilter = (ev) => {
        setFilterValue(ev.target.value);
    };

    const getStats = useCallback(updateStats, [filterValue]);

    useEffect(() => {
        if (!didMount.current) {
            getStats();
            return;
        }
        getStats();
    }, [getStats, filterValue]);

    return (
        <View ident="configStats" error={error}>
            <h2>Global family statistics</h2>
            <div>
                Show stats from:
                <select
                    className="custom-select"
                    value={filterValue}
                    onChange={onChangeFilter}
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
                items={items}
                columnNames={["Family", "Last upload", "Unique configs"]}
                sortOrder={sortOrder}
                onSort={onSort}
            />
        </View>
    );
}
