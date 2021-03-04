import React, { useState, useEffect, useRef, useContext } from "react";
import InfiniteScroll from "react-infinite-scroller";

import { APIContext } from "@mwdb-web/commons/api/context";

export default function RecentViewList(props) {
    const api = useContext(APIContext);
    const infiniteScroll = useRef(null);
    // Loaded object items
    let [elements, setElements] = useState([]);
    // Loaded page number
    let [loadedPages, setLoadedPages] = useState(0);
    // Page number to be loaded
    let [pageToLoad, setPageToLoad] = useState(0);
    // There are more pages to load
    let [hasMorePages, setHasMorePages] = useState(false);

    const pendingLoad = pageToLoad > loadedPages;
    // We want to load pages sequentially
    // Don't spawn new callbacks during pending load operation
    const hasMore = hasMorePages && !pendingLoad;

    // If query changes, reset state
    useEffect(() => {
        if (infiniteScroll.current) infiniteScroll.current.pageLoaded = 0;
        if (!props.query && props.disallowEmpty) {
            setPageToLoad(0);
            setHasMorePages(false);
        } else setPageToLoad(1);
        setElements([]);
        setLoadedPages(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.query, api.remote]);

    // Load page on request (pageToLoad != loadedPages)
    useEffect(() => {
        let cancelled = false;
        if (!pendingLoad)
            // Already synchronized: nothing to load
            return;
        const pivot = elements.slice(-1)[0];
        api.getObjectList(props.type, pivot && pivot.id, props.query)
            .then((response) => {
                if (cancelled) return;
                const loadedElements = response.data[`${props.type}s`];
                setElements((elements) => [...elements, ...loadedElements]);
                setHasMorePages(loadedElements.length !== 0);
            })
            .catch((error) => {
                if (cancelled) return;
                props.setError(error);
                setHasMorePages(false);
            })
            .finally(() => {
                if (cancelled) return;
                setLoadedPages((loadedPages) => loadedPages + 1);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageToLoad, loadedPages]);

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
                    setPageToLoad(loadedPages + 1);
                }}
                hasMore={hasMore}
                element={"tbody"}
            >
                {elements.map((item, idx) => (
                    <Row key={idx} addToQuery={props.addToQuery} {...item} />
                ))}
                {!elements.length && !pendingLoad ? (
                    <tr key="empty" className="d-flex">
                        <td className="col-12 text-center">
                            There are no elements to show.
                        </td>
                    </tr>
                ) : (
                    []
                )}
                {pendingLoad ? (
                    <tr key="loading" className="d-flex">
                        <td className="col-12 text-center">Loading...</td>
                    </tr>
                ) : (
                    []
                )}
            </InfiniteScroll>
        </table>
    );
}
