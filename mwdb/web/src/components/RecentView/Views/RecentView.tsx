import { useCallback, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { APIContext } from "@mwdb-web/commons/api";
import { addFieldToQuery, multiFromHashes } from "@mwdb-web/commons/helpers";
import { View } from "@mwdb-web/commons/ui";

import { RecentViewList } from "./RecentViewList";
import { QuickQuery } from "../common/QuickQuery";
import { ObjectType } from "@mwdb-web/types/types";
import { AxiosError } from "axios";
import { isEmpty } from "lodash";

type Props = {
    type: ObjectType;
    rowComponent: React.ComponentType<any>;
    headerComponent: React.ComponentType<any>;
    disallowEmpty?: boolean;
};

export function RecentView(props: Props) {
    const api = useContext(APIContext);
    const [searchParams, setSearchParams] = useSearchParams();
    // Current query set in URI path
    const currentQuery = searchParams.get("q") || "";
    // Submitted query for which we know it's valid and
    // we can load next parts of results into UI
    const [submittedQuery, setSubmittedQuery] = useState(currentQuery);

    // Query input state
    const [queryInput, setQueryInput] = useState(currentQuery);
    // Query error shown under the query bar
    const [queryError, setQueryError] = useState<AxiosError<{
        message: string;
    }> | null>(null);
    const [objectCount, setObjectCount] = useState<number | null>(null);
    // const [countingEnabled, setCountingEnabled] = useState(true);
    const countingEnabled = searchParams.get("count") === "1" ? 1 : 0;
    const isLocked = !queryError && submittedQuery !== currentQuery;

    /**
     * Here be dragons:
     * - queryInput is what is currently in search input bar
     * - currentQuery represents what is in &q= URL
     * - submittedQuery is query that is currently used for listing
     *
     * When user goes directly into &q=... URL:
     *     - currentQuery => queryInput (as initialState)
     *     - currentQuery is submitted via submitQuery
     * When user submits query in search input bar:
     *     - queryInput => currentQuery (via setCurrentQuery)
     *     - currentQuery is changed, so it is submitted via submitQuery (effect)
     * When user clears search input bar:
     *     - "" => queryInput => currentQuery => submittedQuery avoiding
     *       submitQuery call
     * When user switches counting:
     *     - countingEnabled is changed, so it is submitted via submitQuery (effect)
     */

    const setCurrentQuery = useCallback(
        (query: string) => {
            setQueryError(null);
            // Optionally convert query if only hash or hashes were provided
            query = multiFromHashes(query);
            // Set query in URL (currentQuery, countingEnabled)
            setSearchParams((prev) => {
                if (query === prev.get("query"))
                    throw new Error("Tried to set the same query twice");
                return {
                    q: query,
                    count: prev.get("count") === "1" ? "1" : "0",
                };
            });
        },
        [setSearchParams]
    );

    const addToQuery = useCallback(
        (field: string, value: string) => {
            return setCurrentQuery(
                addFieldToQuery(submittedQuery, field, value)
            );
        },
        [submittedQuery, setCurrentQuery]
    );

    const submitQueryWithoutCount = useCallback(
        (query: string) => {
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
        (query: string) => {
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
                    setObjectCount(response.data.count);
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
        (query: string) => {
            return countingEnabled
                ? submitQueryWithCount(query)
                : submitQueryWithoutCount(query);
        },
        [countingEnabled, submitQueryWithCount, submitQueryWithoutCount]
    );

    useEffect(() => {
        setQueryInput(currentQuery);
        if (!currentQuery) {
            setSubmittedQuery("");
        } else {
            return submitQuery(currentQuery);
        }
    }, [currentQuery, submitQuery]);

    const canAddQuickQuery =
        !isEmpty(queryInput) && !isLocked && queryInput === submittedQuery;

    const queryErrorMessage = queryError ? (
        <div className="form-hint">
            {queryError.response && queryError.response.data
                ? queryError.response.data["message"]
                : queryError.toString()}
        </div>
    ) : (
        []
    );

    let objectCountMessage: JSX.Element = <></>;
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
        <View fluid ident="recentObjects">
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
                                />
                            </div>
                            <div
                                className="btn-group"
                                data-toggle="tooltip"
                                title={`Turn ${
                                    countingEnabled ? "off" : "on"
                                } results counting`}
                            >
                                <input
                                    type="button"
                                    className={`btn btn-outline-info rounded-0 shadow-none ${
                                        searchParams.get("count") === "1"
                                            ? "active"
                                            : ""
                                    }`}
                                    value="Count"
                                    onClick={() => {
                                        setSearchParams(
                                            (prev) => {
                                                return {
                                                    q: prev.get("q") || "",
                                                    count: countingEnabled
                                                        ? "0"
                                                        : "1",
                                                };
                                            },
                                            { replace: true }
                                        );
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
                            submitQuery={(query) => setCurrentQuery(query)}
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
                    disallowEmpty={props.disallowEmpty ?? false}
                    setQueryError={setQueryError}
                    addToQuery={addToQuery}
                />
            </div>
        </View>
    );
}
