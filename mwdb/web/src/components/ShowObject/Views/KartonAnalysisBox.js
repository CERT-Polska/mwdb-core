import React, { useContext, useState, useEffect, useCallback } from "react";
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

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Extendable } from "@mwdb-web/commons/extensions";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { ActionCopyToClipboard } from "@mwdb-web/commons/ui";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

function KartonAnalysisRow({ analysis, removeAnalysis }) {
    const auth = useContext(AuthContext);
    const queueStatusBadge = (queueStatus) => {
        const badgeStyle = queueStatus === "Started" ? "success" : "secondary";
        return (
            <span
                className={`badge badge-${badgeStyle}`}
                style={{ marginRight: "8pt" }}
            >
                {queueStatus}
            </span>
        );
    };

    const analysisStatusBadge = (analysisStatus) => {
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

    const queueProcessingList = (
        <ul>
            {analysis["processing_in"]
                ? Object.keys(analysis["processing_in"]).map((queue) => {
                      let queueStatus = analysis["processing_in"][queue];
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
        <Extendable ident="kartonAnalysisActionButtons" analysis={analysis}>
            <Link to={makeSearchLink("karton", analysis.id)}>
                <span className="badge badge-primary">
                    <FontAwesomeIcon icon={faSearch} pull="left" />
                    Search artifacts
                </span>
            </Link>
        </Extendable>
    );

    return (
        <div>
            <div className="flickerable">
                {analysisStatusBadge(analysis["status"])}
                <button
                    className="btn btn-link dropdown-toggle"
                    data-toggle="collapse"
                    data-target={`#collapse${analysis.id}`}
                >
                    <span>{analysis.id}</span>
                </button>
                <span className="ml-2">
                    <ActionCopyToClipboard
                        text={analysis.id}
                        tooltipMessage="Copy analysis id to clipboard"
                    />
                </span>

                {auth.hasCapability(Capability.removingKarton) && (
                    <span
                        className="ml-2"
                        data-toggle="tooltip"
                        title="Remove Karton analysis from this object"
                        onClick={() => {
                            removeAnalysis(analysis.id);
                        }}
                    >
                        <i>
                            <FontAwesomeIcon
                                icon={"trash"}
                                size="sm"
                                style={{ cursor: "pointer" }}
                            />
                        </i>
                    </span>
                )}
            </div>
            <div id={`collapse${analysis.id}`} className="collapse">
                <div className="card-body">
                    {analysis["last_update"] ? (
                        <div>
                            <b>Last update:</b>{" "}
                            {readableTime(new Date(analysis["last_update"]))}
                        </div>
                    ) : (
                        []
                    )}
                    {Object.keys(analysis["processing_in"]).length > 0 ? (
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

export default function KartonAnalysisBox() {
    const [analyses, setAnalyses] = useState([]);
    const [isResubmitPending, setResubmitPending] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [analysisToRemove, setAnalysisToRemove] = useState(null);

    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const { object, setObjectError } = useContext(ObjectContext);
    const objectId = object.id;
    const isReanalysisAvailable = auth.hasCapability(
        Capability.kartonReanalyze
    );

    async function updateAnalyses() {
        try {
            let response = await api.getKartonAnalysesList(objectId);
            setAnalyses(response.data.analyses);
        } catch (error) {
            setObjectError(error);
        }
    }
    const getAnalyses = useCallback(updateAnalyses, [
        api,
        objectId,
        setObjectError,
    ]);

    useEffect(() => {
        getAnalyses();
        const updateInterval = setInterval(() => {
            getAnalyses();
        }, 10000);
        return () => {
            clearInterval(updateInterval);
        };
    }, [getAnalyses]);

    async function submitAnalysis(ev) {
        ev.preventDefault();
        setResubmitPending(true);
        try {
            await api.resubmitKartonAnalysis(objectId);
            updateAnalyses();
        } catch (error) {
            setObjectError(error);
        }
    }

    async function removeAnalysis(analysisId) {
        try {
            await api.removeKartonAnalysisFromObject(objectId, analysisId);
            updateAnalyses();
        } catch (error) {
            setObjectError(error);
        } finally {
            setDeleteModalOpen(false);
        }
    }

    function handleRemoveAnalysis(analysisId) {
        setAnalysisToRemove(analysisId);
        setDeleteModalOpen(true);
    }

    return (
        <Extendable ident="kartonAnalysisBox">
            <div className="card card-default">
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onRequestClose={() => setDeleteModalOpen(false)}
                    onConfirm={() => {
                        removeAnalysis(analysisToRemove);
                    }}
                    message="Remove the analysis from object?"
                    confirmText="Remove"
                />

                <div className="card-header">
                    Karton analyses
                    <Link
                        to="#"
                        onClick={submitAnalysis}
                        className={["float-right"]
                            .concat(
                                isReanalysisAvailable && !isResubmitPending
                                    ? []
                                    : ["text-muted"]
                            )
                            .join(" ")}
                    >
                        <FontAwesomeIcon icon={faPlus} pull="left" />
                        Reanalyze
                    </Link>
                </div>
                {analyses.length ? (
                    <table className="table table-striped table-bordered wrap-table">
                        {analyses
                            .slice()
                            .reverse()
                            .map((analysis) => (
                                <tr key={analysis.id}>
                                    <td>
                                        <KartonAnalysisRow
                                            analysis={analysis}
                                            removeAnalysis={
                                                handleRemoveAnalysis
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                    </table>
                ) : (
                    <div className="card-body text-muted">
                        Object was never analyzed by Karton
                    </div>
                )}
            </div>
        </Extendable>
    );
}
