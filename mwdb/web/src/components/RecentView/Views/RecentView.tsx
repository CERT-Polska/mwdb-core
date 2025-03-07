import { useCallback, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { APIContext } from "@mwdb-web/commons/api";
import { addFieldToQuery, multiFromHashes } from "@mwdb-web/commons/helpers";
import { View } from "@mwdb-web/commons/ui";

import { RecentViewList } from "./RecentViewList";
import { QuickQuery } from "../common/QuickQuery";
import { ObjectType } from "@mwdb-web/types/types";
import { AxiosError } from "axios";

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
    // Query input state
    const [queryInput, setQueryInput] = useState(currentQuery);
    // Query error shown under the query bar
    const [queryError, setQueryError] = useState<AxiosError<{
        message: string;
    }> | null>(null);
    const [objectCount, setObjectCount] = useState<number | null>(null);
    const countingEnabled = searchParams.get("count") === "1" ? 1 : 0;

    const setCurrentQuery = useCallback(
        (query: string) => {
            setQueryError(null);
            // Optionally convert query if only hash or hashes were provided
            query = multiFromHashes(query);
            // Set query in URL (currentQuery, countingEnabled)
            setSearchParams(
                (prev) => {
                    if (query === prev.get("query"))
                        throw new Error("Tried to set the same query twice");
                    return {
                        ...Object.fromEntries(prev.entries()),
                        q: query,
                        count: prev.get("count") === "1" ? "1" : "0",
                    };
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );

    const addToQuery = useCallback(
        (field: string, value: string) => {
            return setCurrentQuery(addFieldToQuery(currentQuery, field, value));
        },
        [currentQuery, setCurrentQuery]
    );

    const makeCountForQuery = useCallback(
        (query: string) => {
            let cancelled = false;
            // Make preflight query to get count of results
            // and check if query is correct
            // First nullify the current count
            setObjectCount(null);
            api.getObjectCount(props.type, query)
                .then((response) => {
                    if (cancelled) return;
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
        [currentQuery, countingEnabled, api, props.type]
    );

    const submitQuery = useCallback(
        (query: string) => {
            setCurrentQuery(query);
            if (countingEnabled) {
                makeCountForQuery(query);
            }
        },
        [countingEnabled, setCurrentQuery, makeCountForQuery]
    );

    useEffect(() => {
        setQueryInput(currentQuery);
        if (!currentQuery) {
            return submitQuery("");
        } else {
            return submitQuery(currentQuery);
        }
    }, [currentQuery, submitQuery]);

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
    if (countingEnabled) {
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
                                                    ...Object.fromEntries(
                                                        prev.entries()
                                                    ),
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
                            query={currentQuery}
                            canAddQuickQuery={true}
                            submitQuery={(query) => setCurrentQuery(query)}
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
                    disallowEmpty={props.disallowEmpty ?? false}
                    setQueryError={setQueryError}
                    addToQuery={addToQuery}
                />
            </div>
        </View>
    );
}
