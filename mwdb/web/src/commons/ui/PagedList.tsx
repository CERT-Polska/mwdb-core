import { ChangeEvent } from "react";
import Pagination from "react-js-pagination";

const perPage = 10;

type Props<T> = {
    activePage: number;
    columnNames: string[];
    filterValue: string;
    items: T[];
    listItem: (props: T) => JSX.Element;
    itemCount: number;
    onPageChange: (pageNumber: number) => void;
    onFilterChange?: (ev: ChangeEvent<HTMLInputElement>) => void;
    tableStyle?: React.CSSProperties;
};

export function PagedList<T>(props: Props<T>) {
    const ListItem = props.listItem;
    const columnNames = props.columnNames;
    return (
        <div className="table-responsive" style={{ ...props.tableStyle }}>
            {props.onFilterChange && (
                <input
                    type="text"
                    name="page-filter"
                    value={props.filterValue}
                    onChange={props.onFilterChange}
                    className="form-control"
                    placeholder="Filter by..."
                />
            )}
            <table className="table table-striped table-bordered wrap-table">
                <thead>
                    <tr>
                        {columnNames.map((h: string, idx: number) => (
                            <th key={idx}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {props.items.length ? (
                        props.items.map((item: T, idx: number) => (
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
            {props.itemCount > perPage && (
                <Pagination
                    activePage={props.activePage}
                    itemsCountPerPage={perPage}
                    totalItemsCount={props.itemCount}
                    pageRangeDisplayed={5}
                    onChange={props.onPageChange}
                    itemClass="page-item"
                    linkClass="page-link"
                />
            )}
        </div>
    );
}
