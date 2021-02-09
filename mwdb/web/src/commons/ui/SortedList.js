import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

class SortedList extends Component {
    sortIcon(idx) {
        let sortOrder = this.props.sortOrder || [-1, 0];
        if (idx !== sortOrder[0]) return "sort";
        if (sortOrder[1] === 1) return "sort-down";
        if (sortOrder[1] === -1) return "sort-up";
    }

    handleSort(idx) {
        let newSortOrder = [idx, 1];
        let sortOrder = this.props.sortOrder || [-1, 0];
        if (idx === sortOrder[0]) newSortOrder = [idx, -sortOrder[1]];
        this.props.onSort(newSortOrder);
    }

    render() {
        let ListItem = this.props.listItem;
        let columnNames = this.props.columnNames || ListItem.columnNames;
        let unsortable = this.props.unsortable || [];

        return (
            <table className="table table-striped table-bordered">
                <thead>
                    {columnNames.map((h, idx) => (
                        <th
                            key={idx}
                            onClick={(ev) => {
                                ev.preventDefault();
                                this.handleSort(idx);
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            {h}
                            {!unsortable.includes(h) ? (
                                <FontAwesomeIcon
                                    icon={this.sortIcon(idx)}
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
                    {this.props.items.length ? (
                        this.props.items.map((item, idx) => (
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
}

export default SortedList;
