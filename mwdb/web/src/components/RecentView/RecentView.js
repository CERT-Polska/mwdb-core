import React, { useState, useEffect, useContext } from "react";
import { Link, useHistory } from "react-router-dom";

import queryString from "query-string";

import { APIContext } from "@mwdb-web/commons/api/context";
import {
    encodeSearchQuery,
    decodeSearchQuery,
    queryFromHash,
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
    /**
     * There are three types of query states
     * - currentQuery:   committed query for which we're showing the results - stored in location
     * - submittedQuery: query submitted by user.
     *                   If different than currentQuery - we need to fetch the first page and
     *                   check if query syntax is correct and there are no other errors.
     * - queryInput:     state of query input
     */
    const api = useContext(APIContext);
    const history = useHistory();
    const getLinkForQuery = (query) =>
        `${history.location.pathname}?${queryString.stringify({
            ...queryString.parse(history.location.search),
            q: encodeSearchQuery(query),
        })}`;
    const currentQuery = decodeSearchQuery(
        (queryString.parse(history.location.search)["q"] || "").trim()
    );
    const setCurrentQuery = (query) => {
        history.push(getLinkForQuery(query));
    };

    // Query input state
    let [queryInput, setQueryInput] = useState(currentQuery);
    // Submitted input state
    // If submittedQuery !== currentQuery: query is uncommitted and needs to be loaded
    let [submittedQuery, setSubmittedQuery] = useState(currentQuery);
    // General error shown in Alert
    let [error, setError] = useState(null);
    // Query error shown under the query bar
    let [queryError, setQueryError] = useState(null);

    let [objectCount, setObjectCount] = useState(null);

    const isLocked = !queryError && submittedQuery !== currentQuery;

    const resetErrors = () => {
        setError(null);
        setQueryError(null);
    };

    const submitQuery = (query) => {
        // If query is already submitted: do nothing
        if (query === submittedQuery) return;
        query = queryFromHash(query, props.dhashOnly);
        // Synchronize input
        setQueryInput(query);
        resetErrors();
        // Submit query
        setSubmittedQuery(query);
    };

    const addToQuery = (field, value) => {
        return submitQuery(addFieldToQuery(currentQuery, field, value));
    };

    // Commit submitted query
    useEffect(() => {
        let cancelled = false;
        // If query is already committed: do nothing
        if (submittedQuery === currentQuery) return;
        // Make preflight query to check if query is correct
        api.getObjectCount(props.type, submittedQuery)
            .then((response) => {
                if (cancelled) return;
                // If ok: commit query
                setCurrentQuery(submittedQuery);
                setObjectCount(response.data["count"]);
            })
            .catch((error) => {
                if (cancelled) return;
                setQueryError(error);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submittedQuery]);

    // Synchronize changed current (committed) query (history back/forward)
    useEffect(() => {
        setQueryInput(currentQuery);
        resetErrors();
        setSubmittedQuery(currentQuery);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQuery]);

    const canAddQuickQuery =
        queryInput && !isLocked && queryInput === currentQuery;

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
        submittedQuery && objectCount ? (
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
                        submitQuery(queryInput);
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
                                    submitQuery("");
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
                            <Link
                                to="/search_help"
                                className="btn btn-outline-primary"
                            >
                                ?
                            </Link>
                        </div>
                    </div>
                    <div className="input-group">
                        {queryError ? queryErrorMessage : objectCountMessage}
                        <QuickQuery
                            type={props.type}
                            query={currentQuery}
                            canAddQuickQuery={canAddQuickQuery}
                            submitQuery={(q) => submitQuery(q)}
                            addToQuery={addToQuery}
                            setQueryError={setQueryError}
                        />
                    </div>
                </form>
                <RecentViewList
                    query={currentQuery}
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
