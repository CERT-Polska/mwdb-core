import { useContext } from "react";
import { Link } from "react-router-dom";
import readableTime from "readable-timestamp";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck,
    faCircleNotch,
    faSearch,
    faBan,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { AuthContext } from "@mwdb-web/commons/auth";
import { Extendable } from "@mwdb-web/commons/plugins";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { ActionCopyToClipboard } from "@mwdb-web/commons/ui";
import { KartonAnalysis } from "@mwdb-web/types/types";
import { Capability } from "@mwdb-web/types/types";

type Props = {
    analysis: KartonAnalysis;
    removeAnalysis: (id: number) => void;
};

export function KartonAnalysisRow({ analysis, removeAnalysis }: Props) {
    const auth = useContext(AuthContext);
    const queueStatusBadge = (queueStatus: string) => {
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

    const setBadge = (analysisStatus: string) => {
        switch (analysisStatus) {
            case "error": {
                return {
                    icon: faBan,
                    style: "danger",
                    message: "error",
                };
            }
            case "running": {
                return {
                    icon: faCircleNotch,
                    style: "warning",
                    message: "processing",
                };
            }
            case "finished": {
                return {
                    icon: faCheck,
                    style: "success",
                    message: "done",
                };
            }
            default: {
                return {
                    icon: faCircleNotch,
                    style: "warning",
                    message: "checking",
                };
            }
        }
    };

    const analysisStatusBadge = (analysisStatus: string) => {
        const badgeAttributes = setBadge(analysisStatus);
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
            {analysis.processing_in ? (
                Object.keys(analysis.processing_in).map((queue: string) => {
                    let queueStatus = analysis.processing_in[queue];
                    return (
                        <li key={queue} className="text-monospace">
                            <div>
                                {queue}
                                {queueStatus.status.map(queueStatusBadge)}
                            </div>
                            <div style={{ fontSize: "x-small" }}>
                                got from {queueStatus.received_from.join(", ")}
                            </div>
                        </li>
                    );
                })
            ) : (
                <></>
            )}
        </ul>
    );

    let actionButtons = (
        <Extendable ident="kartonAnalysisActionButtons" analysis={analysis}>
            <Link
                to={makeSearchLink({
                    field: "karton",
                    value: analysis.id.toString(),
                    pathname: "/search",
                })}
            >
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
                {analysisStatusBadge(analysis.status)}
                <button
                    className="btn btn-link dropdown-toggle"
                    data-toggle="collapse"
                    data-target={`#collapse${analysis.id}`}
                >
                    <span>{analysis.id}</span>
                </button>
                <span className="ml-2">
                    <ActionCopyToClipboard
                        text={analysis.id.toString()}
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
                                icon={faTrash}
                                size="sm"
                                style={{ cursor: "pointer" }}
                            />
                        </i>
                    </span>
                )}
            </div>
            <div id={`collapse${analysis.id}`} className="collapse">
                <div className="card-body">
                    {analysis.last_update ? (
                        <div>
                            <b>Last update:</b>{" "}
                            {readableTime(new Date(analysis.last_update))}
                        </div>
                    ) : (
                        <></>
                    )}
                    {Object.keys(analysis.processing_in).length > 0 ? (
                        <div>
                            <b>Currently processed by:</b>
                            {queueProcessingList}
                        </div>
                    ) : (
                        <></>
                    )}
                    {actionButtons}
                </div>
            </div>
        </div>
    );
}
