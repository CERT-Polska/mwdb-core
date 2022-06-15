import React from "react";
import Pagination from "react-js-pagination";

export default function PagedList(props) {
    const ListItem = props.listItem;
    const columnNames = props.columnNames || ListItem.columnNames;
    return (
        <div className="table-responsive" style={{ ...props.tableStyle }}>
            {props.onFilterChange ? (
                <input
                    type="text"
                    name="page-filter"
                    value={props.filterValue}
                    onChange={props.onFilterChange}
                    className="form-control"
                    placeholder="Filter by..."
                />
            ) : (
                []
            )}
            <table className="table table-striped table-bordered wrap-table">
                <thead>
                    <tr>
                        {columnNames.map((h, idx) => (
                            <th key={idx}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {props.items.length ? (
                        props.items.map((item, idx) => (
                            <ListItem
                                key={idx}
                                {...item}
                                filterValue={props.filterValue}
                            />
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
            {props.itemCount > 10 ? (
                <Pagination
                    activePage={props.activePage}
                    itemsCountPerPage={10}
                    totalItemsCount={props.itemCount}
                    pageRangeDisplayed={5}
                    onChange={props.onPageChange}
                    itemClass="page-item"
                    linkClass="page-link"
                />
            ) : (
                []
            )}
        </div>
    );
}
