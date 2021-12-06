import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import readableTime from "readable-timestamp";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faCircleNotch,
    faSearch,
    faBan,
    faPlus,
} from "@fortawesome/free-solid-svg-icons";

import api from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { ActionCopyToClipboard } from "@mwdb-web/commons/ui";

function KartonAttributeRow(props) {
    const [status, setStatus] = useState();
    const [error, setError] = useState();

    useEffect(() => {
        let isMounted = true;
        if (props.uid && status === undefined) {
            api.getKartonAnalysisStatus(props.object.id, props.uid)
                .then((response) => {
                    if (!isMounted) return;
                    setStatus(response.data);
                    // Completed tasks are not the running ones
                    if (response.data.status !== "running")
                        props.onCompleted(props.uid);
                })
                .catch((error) => {
                    if (!isMounted) return;
                    setError(error);
                    // ... but failed ones are completed
                    props.onCompleted(props.uid);
                });
        }
        // Invalidate component
        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, props.object.id, props.uid]);

    // If object has changed - reset status and error
    useEffect(() => {
        setStatus(undefined);
        setError(undefined);
    }, [props.uid]);

    let queueStatusBadge = (queueStatus) => {
        let badgeStyle = queueStatus === "Started" ? "success" : "secondary";
        return (
            <span
                className={`badge badge-${badgeStyle}`}
                style={{ marginRight: "8pt" }}
            >
                {queueStatus}
            </span>
        );
    };

    let analysisStatusBadge = (analysisStatus) => {
        const badgeAttributes = {
            [undefined]: {
                icon: faCircleNotch,
                style: "warning",
                message: "checking",
            },
            error: {
                icon: faBan,
                style: "danger",
                message: "error",
            },
            running: {
                icon: faCircleNotch,
                style: "warning",
                message: "processing",
            },
            finished: {
                icon: faCheck,
                style: "success",
                message: "done",
            },
        }[analysisStatus];
        return (
            <span
                className={`badge badge-${badgeAttributes.style}`}
                style={{ marginRight: "8pt" }}
            >
                <FontAwesomeIcon
                    icon={badgeAttributes.icon}
                    pull="left"
                    spin={badgeAttributes.icon === faCircleNotch}
                />
                {badgeAttributes.message}
            </span>
        );
    };

    let queueProcessingList = (
        <ul>
            {status && status["processing_in"]
                ? Object.keys(status["processing_in"]).map((queue) => {
                      let queueStatus = status["processing_in"][queue];
                      return (
                          <li key={queue} className="text-monospace">
                              <div>
                                  {queue}
                                  {queueStatus["status"].map(queueStatusBadge)}
                              </div>
                              <div style={{ fontSize: "x-small" }}>
                                  got from{" "}
                                  {queueStatus["received_from"].join(", ")}
                              </div>
                          </li>
                      );
                  })
                : []}
        </ul>
    );

    let actionButtons = (
        <div>
            <Link to={makeSearchLink("karton", props.uid)}>
                <span className="badge badge-primary">
                    <FontAwesomeIcon icon={faSearch} pull="left" />
                    Search artifacts
                </span>
            </Link>
        </div>
    );

    return (
        <div className="card">
            <div className="card-header flickerable">
                {analysisStatusBadge(
                    (error && "error") || (status && status["status"])
                )}
                <button
                    className="btn btn-link dropdown-toggle"
                    data-toggle="collapse"
                    data-target={`#collapse${props.uid}`}
                >
                    <span>{props.uid}</span>
                </button>
                <span className="ml-2">
                    <ActionCopyToClipboard
                        text={props.uid}
                        tooltipMessage="Copy analysis id to clipboard"
                    />
                </span>
            </div>
            <div id={`collapse${props.uid}`} className="collapse">
                <div className="card-body">
                    {error ? (
                        <div>
                            <b>Error:</b>{" "}
                            {(error.response && error.response.data.message) ||
                                error.toString()}
                        </div>
                    ) : (
                        []
                    )}
                    {status && status["last_update"] ? (
                        <div>
                            <b>Last update:</b>{" "}
                            {readableTime(new Date(status["last_update"]))}
                        </div>
                    ) : (
                        []
                    )}
                    {status &&
                    Object.keys(status["processing_in"]).length > 0 ? (
                        <div>
                            <b>Currently processed by:</b>
                            {queueProcessingList}
                        </div>
                    ) : (
                        []
                    )}
                    {actionButtons}
                </div>
            </div>
        </div>
    );
}

export function FirstAnalysisBanner({
    attributes,
    onUpdateAttributes,
    object,
}) {
    const [submitted, setSubmitted] = useState(false);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const isReanalysisAvailable = auth.hasCapability(
        Capability.kartonReanalyze
    );

    if (!isReanalysisAvailable || !attributes) return [];

    if (
        Object.keys(attributes).some((label) =>
            attributes[label].some((attr) => attr.key === "karton")
        )
    )
        return [];

    let analyze = async (ev) => {
        ev.preventDefault();
        setSubmitted(true);
        try {
            await api.resubmitKartonAnalysis(object.id);
            // Update attributes
            onUpdateAttributes();
        } catch (error) {
            context.setObjectError(error);
        }
    };

    return (
        <div className="alert alert-primary">
            Oh! You've never run a Karton analysis for this sample.
            <button
                type="button"
                disabled={submitted}
                className="btn-xs btn-primary float-right"
                onClick={analyze}
            >
                Analyze!
            </button>
        </div>
    );
}

export function KartonAttributeRenderer({ values, onUpdateAttributes }) {
    const [maxItems, setMaxItems] = useState(3);
    const [completedItems, setCompletedItems] = useState([]);
    const [visibleItems, setVisibleItems] = useState([]);
    const [canReanalyze, setCanReanalyze] = useState(false);

    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const isReanalysisAvailable = auth.hasCapability(
        Capability.kartonReanalyze
    );

    useEffect(() => {
        setVisibleItems(values.slice(0, maxItems).map((attr) => attr.value));
    }, [maxItems, values]);

    useEffect(() => {
        // User can reanalyze if all visible items are completed
        setCanReanalyze(
            !!visibleItems.length &&
                isReanalysisAvailable &&
                visibleItems.every((uid) => completedItems.includes(uid))
        );
    }, [visibleItems, completedItems, isReanalysisAvailable]);

    const submitAnalysis = async (ev) => {
        ev.preventDefault();
        // Turn off second reanalysis until we get new attribute state
        setCanReanalyze(false);
        // Trigger reanalysis
        try {
            await api.resubmitKartonAnalysis(context.object.id);
            // Update attributes
            onUpdateAttributes();
        } catch (error) {
            context.setObjectError(error);
        }
    };

    const showMore = (ev) => {
        ev.preventDefault();
        setMaxItems(maxItems + 3);
        setCanReanalyze(false);
    };

    let reanalyzeButton = canReanalyze ? (
        <Link to="#" onClick={submitAnalysis}>
            <span className="badge badge-success">
                <FontAwesomeIcon icon={faPlus} pull="left" />
                reanalyze
            </span>
        </Link>
    ) : (
        <span className="badge badge-muted">
            <FontAwesomeIcon icon={faPlus} pull="left" />
            reanalyze
        </span>
    );

    let attributesRows = visibleItems.map((item) => (
        <KartonAttributeRow
            key={item}
            uid={item}
            object={context.object}
            onCompleted={(uid) => {
                setCompletedItems((completed) => completed.concat([uid]));
            }}
        />
    ));

    return (
        <tr key="Karton analysis">
            <th>Karton analysis</th>
            <td>
                {attributesRows}
                {maxItems < values.length ? (
                    <Link to="#" onClick={showMore}>
                        <span className="badge badge-primary">more...</span>
                    </Link>
                ) : (
                    []
                )}
                {isReanalysisAvailable ? reanalyzeButton : []}
            </td>
        </tr>
    );
}
