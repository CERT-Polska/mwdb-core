import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSort,
    faSortUp,
    faSortDown,
} from "@fortawesome/free-solid-svg-icons";

export default function SortedList(props) {
    const ListItem = props.listItem;
    const columnNames = props.columnNames || ListItem.columnNames;
    const unsortable = props.unsortable || [];

    function sortIcon(idx) {
        let sortOrder = props.sortOrder || [-1, 0];
        if (idx !== sortOrder[0]) return faSort;
        if (sortOrder[1] === 1) return faSortDown;
        if (sortOrder[1] === -1) return faSortUp;
    }

    function handleSort(idx) {
        let newSortOrder = [idx, 1];
        let sortOrder = props.sortOrder || [-1, 0];
        if (idx === sortOrder[0]) newSortOrder = [idx, -sortOrder[1]];
        props.onSort(newSortOrder);
    }

    return (
        <table className="table table-striped table-bordered">
            <thead>
                {columnNames.map((h, idx) => (
                    <th
                        key={idx}
                        onClick={(ev) => {
                            ev.preventDefault();
                            handleSort(idx);
                        }}
                        style={{ cursor: "pointer" }}
                    >
                        {h}
                        {!unsortable.includes(h) ? (
                            <FontAwesomeIcon
                                icon={sortIcon(idx)}
                                pull="right"
                                size="x"
                            />
                        ) : (
                            []
                        )}
                    </th>
                ))}
            </thead>
            <tbody>
                {props.items.length ? (
                    props.items.map((item, idx) => (
                        <ListItem key={idx} {...item} />
                    ))
                ) : (
                    <tr>
                        <td
                            colSpan={columnNames.length}
                            className="text-center"
                        >
                            Nothing to display.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
