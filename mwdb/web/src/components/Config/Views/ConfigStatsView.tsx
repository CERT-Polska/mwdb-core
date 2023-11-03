import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { api } from "@mwdb-web/commons/api";
import { SortedList, View } from "@mwdb-web/commons/ui";
import { getErrorMessage } from "@mwdb-web/commons/helpers";
import { Family } from "@mwdb-web/types/types";
import { ConfigStatsItem } from "../common/ConfigStatsItem";

export function ConfigStatsView() {
    const [families, setFamilies] = useState<Family[]>([]);
    const [sortOrder, setSortOrder] = useState<number[]>([0, 1]);
    const [filterValue, setFilterValue] = useState<string>("*");

    const columns: (keyof Family)[] = ["family", "last_upload", "count"];
    const sortCriterion = columns[sortOrder[0]];
    const sortOrderVariable = sortOrder[1];
    const items: Family[] = families.sort((a, b) => {
        if (a[sortCriterion] < b[sortCriterion]) return -sortOrderVariable;
        if (a[sortCriterion] > b[sortCriterion]) return sortOrderVariable;
        return 0;
    });

    useEffect(() => {
        getStats();
    }, [filterValue]);

    async function getStats() {
        try {
            const response = await api.getConfigStats(filterValue);
            setFamilies(response.data.families);
        } catch (error: any) {
            toast(getErrorMessage(error), {
                type: "error",
            });
        }
    }

    return (
        <View ident="configStats">
            <h2>Global family statistics</h2>
            <div>
                Show stats from:
                <select
                    className="custom-select"
                    value={filterValue}
                    onChange={(ev) => setFilterValue(ev.target.value)}
                >
                    <option value="*">all time</option>
                    <option value="24h">last 24 hours</option>
                    <option value="72h">last 72 hours</option>
                    <option value="7d">last 7 days</option>
                    <option value="30d">last 30 days</option>
                    <option value="90d">last 90 days</option>
                </select>
            </div>
            <SortedList<Family>
                listItem={ConfigStatsItem}
                items={items}
                columnNames={["Family", "Last upload", "Unique configs"]}
                sortOrder={sortOrder}
                onSort={setSortOrder}
            />
        </View>
    );
}
