import React, { useContext, useEffect, useReducer, useRef } from "react";
import InfiniteScroll from "react-infinite-scroller";

import { APIContext } from "@mwdb-web/commons/api/context";

function listStateReducer(state, action) {
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
                hasMorePages: action.elements.length !== 0,
                elements: [...state.elements, ...action.elements],
            };
        default:
            throw new Error(`Incorrect action type: ${action.type}`);
    }
}

export default function RecentViewList(props) {
    const api = useContext(APIContext);
    const [listState, listDispatch] = useReducer(listStateReducer, {
        pageToLoad: 0,
        loadedPages: 0,
        elements: [],
        hasMorePages: false,
    });
    const infiniteScroll = useRef(null);
    const pendingLoad = listState.pageToLoad > listState.loadedPages;
    const hasMore = listState.hasMorePages && !pendingLoad;

    // If query changes, reset state
    useEffect(() => {
        if (infiniteScroll.current) infiniteScroll.current.pageLoaded = 0;
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
                const elements = response.data[`${props.type}s`];
                listDispatch({
                    type: "pageLoaded",
                    elements,
                });
            })
            .catch((error) => {
                if (cancelled) return;
                props.setError(error);
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

    const Row = props.rowComponent;
    const Header = props.headerComponent;
    const tableStyle = {
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
                ref={infiniteScroll}
                loadMore={(page) => {
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
                ) : !listState.elements.length && props.query !== null ? (
                    <tr key="empty" className="d-flex">
                        <td className="col-12 text-center">
                            There are no elements to show.
                        </td>
                    </tr>
                ) : (
                    []
                )}
            </InfiniteScroll>
        </table>
    );
}
