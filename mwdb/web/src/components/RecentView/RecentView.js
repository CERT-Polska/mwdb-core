import React, {useState, useEffect, useContext, useCallback} from "react";
import {useSearchParams} from "react-router-dom";

import {APIContext} from "@mwdb-web/commons/api/context";
import {multiFromHashes, addFieldToQuery} from "@mwdb-web/commons/helpers";
import {View} from "@mwdb-web/commons/ui";

import RecentViewList from "./RecentViewList";
import QuickQuery from "./QuickQuery";

export function RecentRow(props) {
    let delta = new Date() - new Date(props.firstSeen);
    if (delta < 24 * 60 * 60 * 1000) return "today";
    if (delta < 72 * 60 * 60 * 1000) return "recent";
    return "";
}

export default function RecentView(props) {
    const api = useContext(APIContext);
    const [searchParams, setSearchParams] = useSearchParams();
    // Current query set in URI path
    const currentQuery = searchParams.get("q") || "";
    // Submitted query for which we know it's valid and
    // we can load next parts of results into UI
    const [submittedQuery, setSubmittedQuery] = useState(null);

    // Query input state
    const [queryInput, setQueryInput] = useState(currentQuery);
    // General error shown in Alert
    const [error, setError] = useState(null);
    // Query error shown under the query bar
    const [queryError, setQueryError] = useState(null);
    const [objectCount, setObjectCount] = useState(null);
    // const [countingEnabled, setCountingEnabled] = useState(true);

    const isLocked = !queryError && submittedQuery !== currentQuery;

    function resetErrors() {
        setError(null);
        setQueryError(null);
    }

    function setCurrentQuery(query, countingEnabled) {
        // If query is already submitted: do nothing
        if (query === submittedQuery) return;
        // Optionally convert query if only hash or hashes were provided
        query = multiFromHashes(query);
        // Set query in URL (currentQuery, countingEnabled)
        setSearchParams({q: query, count: countingEnabled});
    }

    const addToQuery = (field, value) => {
        return setCurrentQuery(addFieldToQuery(submittedQuery, field, value));
    };

    // Synchronize input if currentQuery was changed
    useEffect(() => {
        setQueryInput(currentQuery);
        resetErrors();
    }, [currentQuery]);


    const submitQueryWithoutCount = useCallback(
        (query) => {
            if (submittedQuery === query) return;

            if (!query) {
                setSubmittedQuery("");
            } else {
                setSubmittedQuery(query);
            }
        },
        [submittedQuery]
    );

    const submitQuery = useCallback(
        async (query) => {
            let cancelled = false;
            // If query is already submitted: do nothing
            if (submittedQuery === query) return;
            // If query is empty, submit immediately
            if (!query) setSubmittedQuery("");
            else {
                // Make preflight query to get count of results
                // and check if query is correct
                await api
                    .getObjectCount(props.type, query)
                    .then((response) => {
                        if (cancelled) return;
                        // If ok: commit query
                        setSubmittedQuery(query);
                        setObjectCount(response.data["count"]);
                    })
                    .catch((error) => {
                        if (cancelled) return;
                        setQueryError(error);
                    });

                return () => {
                    cancelled = true;
                };
            }
        },
        [api, props.type, submittedQuery]
    );

    useEffect(() => {
        const countingEnabled = searchParams.get("count");
        console.log(countingEnabled);
        // console.log(+countingEnabled);

        // {searchParams && console.log(searchParams.getAll('count'));}

        Boolean(countingEnabled)
            ? (submitQuery(currentQuery))
            : (submitQueryWithoutCount(currentQuery))
    }, [currentQuery, submitQuery, submitQueryWithoutCount]);

    const canAddQuickQuery =
        queryInput && !isLocked && queryInput === submittedQuery;

    const queryErrorMessage = queryError ? (
        <div className="form-hint">
            {queryError.response
                ? queryError.response.data["message"]
                : queryError.toString()}
        </div>
    ) : (
        []
    );

    const objectCountMessage =
        submittedQuery && objectCount !== null ? (
            <div className="form-hint">
                {objectCount}
                {" results found"}
            </div>
        ) : (
            []
        );

    return (
        <View fluid ident="recentObjects" error={error}>
            <div className="table-responsive">
                <form
                    className="searchForm"
                    onSubmit={(ev) => {
                        ev.preventDefault();
                        setCurrentQuery(queryInput);
                    }}
                >
                    <div className="input-group">
                        <div className="input-group-prepend">
                            <input
                                className="btn btn-outline-danger"
                                type="button"
                                value="X"
                                onClick={(ev) => {
                                    ev.preventDefault();
                                    setCurrentQuery("");
                                }}
                            />
                        </div>
                        <input
                            className="form-control small"
                            type="text"
                            placeholder="Search (Lucene query or hash)..."
                            value={queryInput}
                            disabled={isLocked}
                            onChange={(evt) => setQueryInput(evt.target.value)}
                        />
                        <div className="input-group-append">
                            <div className="btn-group">
                                <input
                                    className="btn btn-outline-success rounded-0"
                                    type="submit"
                                    value="Search"
                                    onClick={(ev) => {
                                        ev.preventDefault();
                                        setCurrentQuery(queryInput, 1);
                                    }}
                                />
                                <button
                                    type="btn"
                                    className="dropdown-toggle dropdown-toggle-split btn btn-outline-success rounded-0"
                                    data-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                >
                                    <span className="sr-only">
                                        Toggle Dropdown
                                    </span>
                                </button>
                                <div className="dropdown-menu">
                                    <button
                                        className="dropdown-item btn btn-outline-success"
                                        type="submit"
                                        onClick={(ev) => {
                                            ev.preventDefault();
                                            setObjectCount(null);
                                            setCurrentQuery(queryInput, 0);
                                        }}
                                    >
                                        Search without count
                                    </button>
                                </div>
                            </div>

                            <a
                                href="https://mwdb.readthedocs.io/en/latest/user-guide/7-Lucene-search.html"
                                className="btn btn-outline-primary"
                            >
                                ?
                            </a>
                        </div>
                    </div>
                    <div className="input-group">
                        {queryError ? queryErrorMessage : objectCountMessage}
                        <QuickQuery
                            type={props.type}
                            query={submittedQuery}
                            canAddQuickQuery={canAddQuickQuery}
                            submitQuery={(q, countingEnabled) => setCurrentQuery(q, countingEnabled)}
                            addToQuery={addToQuery}
                            setQueryError={setQueryError}
                        />
                    </div>
                </form>
                <RecentViewList
                    query={submittedQuery}
                    type={props.type}
                    rowComponent={props.rowComponent}
                    headerComponent={props.headerComponent}
                    locked={isLocked}
                    disallowEmpty={props.disallowEmpty}
                    setError={setError}
                    addToQuery={addToQuery}
                />
            </div>
        </View>
    );
}
