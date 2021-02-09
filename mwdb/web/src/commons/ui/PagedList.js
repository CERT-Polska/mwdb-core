import React, { Component } from "react";
import Pagination from "react-js-pagination";

class PagedList extends Component {
    render() {
        let ListItem = this.props.listItem;
        let columnNames = this.props.columnNames || ListItem.columnNames;
        return (
            <div
                className="table-responsive"
                style={{ ...this.props.tableStyle }}
            >
                {this.props.onFilterChange ? (
                    <input
                        type="text"
                        name="page-filter"
                        value={this.props.filterValue}
                        onChange={this.props.onFilterChange}
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
                        {this.props.items.length ? (
                            this.props.items.map((item, idx) => (
                                <ListItem
                                    key={idx}
                                    {...item}
                                    filterValue={this.props.filterValue}
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
                {this.props.itemCount > 10 ? (
                    <Pagination
                        activePage={this.props.activePage}
                        itemsCountPerPage={10}
                        totalItemsCount={this.props.itemCount}
                        pageRangeDisplayed={5}
                        onChange={this.props.onPageChange}
                        itemClass="page-item"
                        linkClass="page-link"
                    />
                ) : (
                    []
                )}
            </div>
        );
    }
}

export default PagedList;
