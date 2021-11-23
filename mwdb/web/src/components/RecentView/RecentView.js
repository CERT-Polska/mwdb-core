import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import queryString from "query-string";

import { APIContext } from "@mwdb-web/commons/api/context";
import {
    encodeSearchQuery,
    decodeSearchQuery,
    multiFromHashes,
    addFieldToQuery,
} from "@mwdb-web/commons/helpers";
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
    const history = useHistory();
    // Current query set in URI path
    const currentQuery = decodeSearchQuery(
        (queryString.parse(history.location.search)["q"] || "").trim()
    );
    // Submitted query for which we know it's valid and
    // we can load next parts of results into UI
    const [submittedQuery, setSubmittedQuery] = useState(null);

    function getQueryURL(query) {
        const queryPart = queryString.stringify({
            ...queryString.parse(history.location.search),
            q: encodeSearchQuery(query),
        });
        return `${history.location.pathname}?${queryPart}`;
    }

    // Query input state
    const [queryInput, setQueryInput] = useState(currentQuery);
    // General error shown in Alert
    const [error, setError] = useState(null);
    // Query error shown under the query bar
    const [queryError, setQueryError] = useState(null);
    const [objectCount, setObjectCount] = useState(null);

    const isLocked = !queryError && submittedQuery !== currentQuery;

    function resetErrors() {
        setError(null);
        setQueryError(null);
    }

    function setCurrentQuery(query) {
        // If query is already submitted: do nothing
        if (query === submittedQuery) return;
        // Optionally convert query if only hash or hashes were provided
        query = multiFromHashes(query);
        // Set query in URL (currentQuery)
        history.push(getQueryURL(query));
    }

    const addToQuery = (field, value) => {
        return setCurrentQuery(addFieldToQuery(submittedQuery, field, value));
    };

    // Synchronize input if currentQuery was changed
    useEffect(() => {
        setQueryInput(currentQuery);
        resetErrors();
    }, [currentQuery]);

    // Submit query if currentQuery was changed
    useEffect(() => {
        let cancelled = false;
        // If query is already submitted: do nothing
        if (submittedQuery === currentQuery) return;
        // If query is empty, submit immediately
        if (!currentQuery) setSubmittedQuery("");
        else {
            // Make preflight query to get count of results
            // and check if query is correct
            api.getObjectCount(props.type, currentQuery)
                .then((response) => {
                    if (cancelled) return;
                    // If ok: commit query
                    setSubmittedQuery(currentQuery);
                    setObjectCount(response.data["count"]);
                })
                .catch((error) => {
                    if (cancelled) return;
                    setQueryError(error);
                });
        }
        return () => {
            // Cancel pending requests after unmount/remount
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuery]);

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
                            <input
                                className="btn btn-outline-success"
                                type="submit"
                                value="Search"
                            />
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
                            submitQuery={(q) => setCurrentQuery(q)}
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
