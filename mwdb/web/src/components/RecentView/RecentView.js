import React, { useCallback, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { APIContext } from "@mwdb-web/commons/api/context";
import { addFieldToQuery, multiFromHashes } from "@mwdb-web/commons/helpers";
import { View } from "@mwdb-web/commons/ui";

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
    const countingEnabled = searchParams.get("count") === "1" ? 1 : 0;
    const isLocked = !queryError && submittedQuery !== currentQuery;

    function resetErrors() {
        setError(null);
        setQueryError(null);
    }

    const setCurrentQuery = useCallback(
        ({ query, enableCounting = countingEnabled }) => {
            // If query is already submitted: do nothing
            // if (query === submittedQuery) return;
            // Optionally convert query if only hash or hashes were provided
            query = multiFromHashes(query);
            // Set query in URL (currentQuery, countingEnabled)
            setSearchParams({ q: query, count: enableCounting });
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
            let cancelled = false;
            // Only check if query is correct
            api.getObjectList(props.type, "", query)
                .then(() => {
                    if (cancelled) return;
                    // If ok: commit query
                    setSubmittedQuery(query);
                })
                .catch((error) => {
                    if (cancelled) return;
                    setQueryError(error);
                });
            return () => {
                cancelled = true;
            };
        },
        [api, props.type]
    );

    const submitQueryWithCount = useCallback(
        (query) => {
            let cancelled = false;
            // Make preflight query to get count of results
            // and check if query is correct
            // First nullify the current count
            setObjectCount(null);
            api.getObjectCount(props.type, query)
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
        },
        [api, props.type]
    );

    const submitQuery = useCallback(
        (query) => {
            setCurrentQuery({
                query,
            });
            return countingEnabled
                ? submitQueryWithCount(query)
                : submitQueryWithoutCount(query);
        },
        [
            countingEnabled,
            setCurrentQuery,
            submitQueryWithCount,
            submitQueryWithoutCount,
        ]
    );

    useEffect(() => {
        if (!currentQuery) setSubmittedQuery("");
        return submitQuery(currentQuery);
    }, [currentQuery, submitQuery]);

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

    let objectCountMessage = [];
    if (submittedQuery && countingEnabled) {
        if (objectCount === null) {
            objectCountMessage = <div className="form-hint">Counting...</div>;
        } else {
            objectCountMessage = (
                <div className="form-hint">
                    {objectCount}
                    {" results found"}
                </div>
            );
        }
    }

    return (
        <View fluid ident="recentObjects" error={error}>
            <div className="table-responsive">
                <form
                    className="searchForm"
                    onSubmit={(ev) => {
                        ev.preventDefault();
                        setCurrentQuery({
                            query: queryInput,
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
                                    setCurrentQuery({
                                        query: "",
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
                                />
                            </div>
                            <div className="btn-group">
                                <input
                                    type="submit"
                                    className={`btn btn-outline-info rounded-0 ${
                                        searchParams.get("count") === "1"
                                            ? "active"
                                            : ""
                                    }`}
                                    value="Count"
                                    onClick={() => {
                                        setSearchParams({
                                            q: queryInput,
                                            count: countingEnabled ? "0" : "1",
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
                                    query,
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
