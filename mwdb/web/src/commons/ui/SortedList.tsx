import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSort,
    faSortUp,
    faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { isNil } from "lodash";

type Props<T> = {
    listItem: (props: T) => JSX.Element;
    sortOrder: number[];
    onSort: (values: number[]) => void;
    items: T[];
    columnNames: string[];
};

export function SortedList<T>(props: Props<T>) {
    const ListItem = props.listItem;
    const columnNames = props.columnNames;

    function sortIcon(idx: number) {
        let sortOrder = props.sortOrder || [-1, 0];
        if (idx !== sortOrder[0]) return faSort;
        if (sortOrder[1] === 1) return faSortDown;
        if (sortOrder[1] === -1) return faSortUp;
    }

    function handleSort(idx: number) {
        let newSortOrder = [idx, 1];
        let sortOrder = props.sortOrder || [-1, 0];
        if (idx === sortOrder[0]) newSortOrder = [idx, -sortOrder[1]];
        props.onSort(newSortOrder);
    }

    return (
        <table className="table table-striped table-bordered">
            <thead>
                <tr>
                    {columnNames.map((h: string, idx: number) => (
                        <th
                            key={idx}
                            onClick={(ev) => {
                                ev.preventDefault();
                                handleSort(idx);
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            {h}
                            {!isNil(sortIcon(idx)) && (
                                <FontAwesomeIcon
                                    icon={sortIcon(idx)!}
                                    pull="right"
                                    size="sm"
                                />
                            )}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {props.items.length ? (
                    props.items.map((item: T, idx: number) => (
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
