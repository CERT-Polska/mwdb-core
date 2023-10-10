import { useContext, useEffect, useReducer } from "react";
import InfiniteScroll from "react-infinite-scroller";

import { APIContext } from "@mwdb-web/commons/api";
import { isEmpty } from "lodash";
import {
    BlobData,
    ConfigData,
    ObjectData,
    ObjectType,
} from "@mwdb-web/types/types";
import { AxiosError } from "axios";

type Elements = ObjectData[] | BlobData[] | ConfigData[];

type ListStateReducerState = {
    pageToLoad: number;
    loadedPages: number;
    hasMorePages: boolean;
    elements: Elements;
};

type ListStateReducerAction = Partial<ListStateReducerState> & {
    type: "unload" | "loadNextPage" | "reload" | "pageLoaded";
};

type AddToQuery = (field: string, value: string) => void;

function listStateReducer(
    state: ListStateReducerState,
    action: ListStateReducerAction
): ListStateReducerState {
    switch (action.type) {
        case "unload":
            return {
                pageToLoad: 0,
                loadedPages: 0,
                hasMorePages: false,
                elements: [],
            };
        case "loadNextPage":
            return {
                ...state,
                pageToLoad: state.loadedPages + 1, // load only one more
            };
        case "reload":
            // unload + loadNextPage
            return {
                pageToLoad: 1,
                loadedPages: 0,
                hasMorePages: false,
                elements: [],
            };
        case "pageLoaded":
            return {
                ...state,
                loadedPages: state.loadedPages + 1,
                hasMorePages: !isEmpty(action.elements),
                elements: [
                    ...state.elements,
                    ...(action.elements ?? []),
                ] as Elements,
            };
        default:
            throw new Error(`Incorrect action type: ${action.type}`);
    }
}

type Props = {
    query: string;
    disallowEmpty: boolean;
    type: ObjectType;
    setQueryError: (
        error: AxiosError<{
            message: string;
        }> | null
    ) => void;
    rowComponent: React.ComponentType;
    headerComponent: React.ComponentType;
    locked: boolean;
    addToQuery: AddToQuery;
};

export function RecentViewList(props: Props) {
    const api = useContext(APIContext);
    const [listState, listDispatch] = useReducer(listStateReducer, {
        pageToLoad: 0,
        loadedPages: 0,
        elements: [],
        hasMorePages: false,
    });
    const pendingLoad = listState.pageToLoad > listState.loadedPages;
    const hasMore = listState.hasMorePages && !pendingLoad;

    // If query changes, reset state
    useEffect(() => {
        // If there is no submitted query (after mount): do nothing
        if (props.query === null) return;
        if (!props.query && props.disallowEmpty) {
            listDispatch({ type: "unload" });
        } else {
            listDispatch({ type: "reload" });
        }
    }, [props.query, props.disallowEmpty, api.remote]);

    // Load page on request (pageToLoad != loadedPages)
    useEffect(() => {
        let cancelled = false;
        if (!pendingLoad)
            // Already synchronized: nothing to load
            return;

        const pivot = listState.elements.slice(-1)[0];
        api.getObjectList(props.type, pivot && pivot.id, props.query)
            .then((response) => {
                if (cancelled) return;
                let elements: Elements = [];
                if (props.type === "blob") {
                    elements = response.data.blobs as BlobData[];
                } else if (props.type === "config") {
                    elements = response.data.configs as ConfigData[];
                } else if (props.type === "file") {
                    elements = response.data.files as ObjectData[];
                } else if (props.type === "object") {
                    elements = response.data.objects as ObjectData[];
                } else throw new Error("Unexpected object type");
                listDispatch({
                    type: "pageLoaded",
                    elements,
                });
            })
            .catch((error) => {
                if (cancelled) return;
                props.setQueryError(error);
                listDispatch({
                    type: "pageLoaded",
                    elements: [],
                });
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listState.pageToLoad, listState.loadedPages]);

    const Row = props.rowComponent as React.ComponentType<{
        addToQuery: AddToQuery;
    }>;
    const Header = props.headerComponent as React.ComponentType;
    const tableStyle: React.CSSProperties = {
        tableLayout: "fixed",
        ...(props.locked ? { pointerEvents: "none", filter: "blur(4px)" } : {}),
    };
    return (
        <table
            className="table table-striped table-bordered wrap-table"
            style={tableStyle}
        >
            <thead>
                <Header />
            </thead>
            <InfiniteScroll
                loadMore={() => {
                    if (!hasMore) return;
                    listDispatch({ type: "loadNextPage" });
                }}
                hasMore={hasMore}
                element={"tbody"}
            >
                {listState.elements.map((item, idx) => (
                    <Row key={idx} addToQuery={props.addToQuery} {...item} />
                ))}
                {pendingLoad ? (
                    <tr key="loading" className="d-flex">
                        <td className="col-12 text-center">Loading...</td>
                    </tr>
                ) : (
                    !listState.elements.length &&
                    props.query !== null && (
                        <tr key="empty" className="d-flex">
                            <td className="col-12 text-center">
                                There are no elements to show.
                            </td>
                        </tr>
                    )
                )}
            </InfiniteScroll>
        </table>
    );
}
