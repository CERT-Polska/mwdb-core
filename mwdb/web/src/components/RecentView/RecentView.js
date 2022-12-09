import React, {useCallback, useContext, useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";

import {APIContext} from "@mwdb-web/commons/api/context";
import {addFieldToQuery, multiFromHashes} from "@mwdb-web/commons/helpers";
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
    const countingEnabled = searchParams.get("count") === "0" ? 0 : 1;
    const isLocked = !queryError && submittedQuery !== currentQuery;

    function resetErrors() {
        setError(null);
        setQueryError(null);
    }

    const setCurrentQuery = useCallback(
        ({query, enableCounting = countingEnabled}) => {
            // If query is already submitted: do nothing
            // if (query === submittedQuery) return;
            // Optionally convert query if only hash or hashes were provided
            query = multiFromHashes(query);
            // Set query in URL (currentQuery, countingEnabled)
            setSearchParams({q: query, count: enableCounting});
        },
        [countingEnabled, setSearchParams]
    );

    const addToQuery = useCallback(
        (field, value) => {
            return setCurrentQuery({
                query: addFieldToQuery(submittedQuery, field, value),
            });
        },
        [submittedQuery, setCurrentQuery]
    );

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
        countingEnabled
            ? submitQuery(currentQuery)
            : submitQueryWithoutCount(currentQuery);
    }, [currentQuery, submitQuery, submitQueryWithoutCount, countingEnabled]);

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
                        setCurrentQuery({
                            query: queryInput,
                            // enableCounting: countingEnabled
                        });
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
                                    // setSearchParams({
                                    //     q: "",
                                    //     count: countingEnabled
                                    // });

                                    setCurrentQuery({
                                        query: "",
                                        // enableCounting: countingEnabled,
                                    });
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
                                        setCurrentQuery({
                                            query: queryInput,
                                            // enableCounting: countingEnabled,
                                        });
                                    }}
                                />


                            </div>

                            <a
                                href="https://mwdb.readthedocs.io/en/latest/user-guide/7-Lucene-search.html"
                                className="btn btn-outline-primary"
                            >
                                ?
                            </a>
                            <div className="form-check form-switch ml-3 flex-column">
                                <input className="form-check-input" type="checkbox" role="switch" autoComplete="off"
                                       id="btn-check-outlined"
                                       checked={countingEnabled}
                                       value={countingEnabled}
                                       onChange={() => {
                                           // setCurrentQuery({
                                           //     query: q,
                                           //     enableCounting: countingEnabled ? '0' : '1',
                                           // });

                                           setSearchParams({
                                               q: queryInput,
                                               count: countingEnabled ? '0' : '1'
                                           });

                                           // comparing to countingEnabled from prevState
                                           if (countingEnabled) {
                                               setObjectCount(null);
                                           }
                                           // but because of this approach, loading site by default, even with "counting 1" will not display
                                           // number of results, because the condition is fulfilled, so objectCount=null
                                       }}

                                />
                                <label className="form-check-label"
                                       htmlFor="btn-check-outlined">Counting</label>
                            </div>

                            {/*<div className="form-check form-switch">*/}
                            {/*    <input className="form-check-input" type="checkbox" role="switch"*/}
                            {/*           id="flexSwitchCheckChecked" checked/>*/}
                            {/*        <label className="form-check-label" htmlFor="flexSwitchCheckChecked">Checked switch*/}
                            {/*            checkbox input</label>*/}
                            {/*</div>*/}
                        </div>
                    </div>
                    <div className="input-group">
                        {queryError ? queryErrorMessage : objectCountMessage}
                        <QuickQuery
                            type={props.type}
                            query={submittedQuery}
                            canAddQuickQuery={canAddQuickQuery}
                            submitQuery={(query) =>
                                setCurrentQuery({
                                    query: query,
                                })
                            }
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
                    setQueryError={setQueryError}
                    addToQuery={addToQuery}
                />
            </div>
        </View>
    );
}
