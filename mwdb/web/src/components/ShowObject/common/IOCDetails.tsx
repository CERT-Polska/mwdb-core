import { useState, useContext, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTimes,
    faSortUp,
    faSortDown,
    faSort,
} from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ConfirmationModal, Tag } from "@mwdb-web/commons/ui";
import { IOCForm, IOCFormHandle } from "./IOCForm";
import { Capability, IOCItem } from "@mwdb-web/types/types";
import { makeSearchLink } from "@mwdb-web/commons/helpers";

function severityBadgeClass(severity: string | null): string {
    switch (severity) {
        case "critical":
            return "badge-danger";
        case "high":
            return "badge-warning";
        case "medium":
            return "badge-info";
        case "low":
            return "badge-secondary";
        default:
            return "badge-light";
    }
}

// Severity has a logical ordering, not alphabetical
const SEVERITY_ORDER: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
};

type SortKey = "type" | "value" | "category" | "severity" | "creation_time";
type SortDir = "asc" | "desc";

function compareIOCs(a: IOCItem, b: IOCItem, key: SortKey, dir: SortDir): number {
    let cmp = 0;
    switch (key) {
        case "type":
            cmp = a.type.localeCompare(b.type);
            break;
        case "value":
            cmp = a.value.localeCompare(b.value);
            break;
        case "category":
            cmp = (a.category || "").localeCompare(b.category || "");
            break;
        case "severity": {
            const sa = SEVERITY_ORDER[a.severity || ""] || 0;
            const sb = SEVERITY_ORDER[b.severity || ""] || 0;
            cmp = sa - sb;
            break;
        }
        case "creation_time":
            cmp = a.creation_time.localeCompare(b.creation_time);
            break;
    }
    return dir === "asc" ? cmp : -cmp;
}

function SortableHeader({
    label,
    sortKey,
    activeSortKey,
    activeSortDir,
    onSort,
    style,
}: {
    label: string;
    sortKey: SortKey;
    activeSortKey: SortKey;
    activeSortDir: SortDir;
    onSort: (key: SortKey) => void;
    style?: React.CSSProperties;
}) {
    const isActive = sortKey === activeSortKey;
    const icon = isActive
        ? activeSortDir === "asc"
            ? faSortUp
            : faSortDown
        : faSort;

    return (
        <th
            onClick={() => onSort(sortKey)}
            style={{
                cursor: "pointer",
                userSelect: "none",
                whiteSpace: "nowrap",
                ...style,
            }}
        >
            {label}{" "}
            <FontAwesomeIcon
                icon={icon}
                style={{ opacity: isActive ? 1 : 0.3 }}
            />
        </th>
    );
}

export function IOCDetails() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const [removeModalOpen, setRemoveModalOpen] = useState<boolean>(false);
    const [iocToRemove, setIocToRemove] = useState<number | null>(null);
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
    const formRef = useRef<IOCFormHandle>(null);
    const [sortKey, setSortKey] = useState<SortKey>("creation_time");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const objectId = context.object!.id;
    const iocs = context.object!.iocs || [];
    const { setObjectError, updateObjectData } = context;

    const sortedIocs = useMemo(() => {
        return [...iocs].sort((a, b) => compareIOCs(a, b, sortKey, sortDir));
    }, [iocs, sortKey, sortDir]);

    function handleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    }

    const updateIOCs = useCallback(async () => {
        try {
            if (objectId) {
                const response = await api.getObjectIOCs(objectId);
                updateObjectData({ iocs: response.data });
            }
        } catch (error) {
            setObjectError(error);
        }
    }, [api, objectId, setObjectError, updateObjectData]);

    useEffect(() => {
        updateIOCs();
    }, [updateIOCs]);

    async function handleIOCSubmit(
        type: string,
        value: string,
        category: string,
        severity: string,
        tags: string[]
    ) {
        try {
            if (objectId) {
                const response = await api.addObjectIOC(
                    objectId,
                    type,
                    value,
                    category || null,
                    severity || null,
                    tags
                );
                updateObjectData({ iocs: response.data });
                setAddModalOpen(false);
            }
        } catch (error) {
            setObjectError(error);
        }
    }

    async function handleIOCRemove(iocId: number) {
        try {
            if (objectId) {
                const response = await api.removeObjectIOC(objectId, iocId);
                updateObjectData({ iocs: response.data });
            }
        } catch (error) {
            setObjectError(error);
        } finally {
            setRemoveModalOpen(false);
        }
    }

    function requestRemove(iocId: number) {
        setIocToRemove(iocId);
        setRemoveModalOpen(true);
    }

    const canDelete = auth.hasCapability(Capability.removingIocs);
    const canAdd = auth.hasCapability(Capability.addingIocs) && !api.remote;

    return (
        <div>
            <ConfirmationModal
                isOpen={removeModalOpen}
                onRequestClose={() => setRemoveModalOpen(false)}
                onConfirm={() => {
                    if (iocToRemove !== null) handleIOCRemove(iocToRemove);
                }}
                message="Remove this IOC from the object?"
                confirmText="Remove"
            />

            <ConfirmationModal
                isOpen={addModalOpen}
                onRequestClose={() => {
                    setAddModalOpen(false);
                    formRef.current?.reset();
                }}
                onConfirm={() => formRef.current?.submit()}
                message="Add IOC"
                confirmText="Add IOC"
                cancelText="Cancel"
                buttonStyle="btn-primary"
                contentStyle={{ width: "500px" }}
            >
                <IOCForm ref={formRef} onIOCSubmit={handleIOCSubmit} />
            </ConfirmationModal>

            <div className="p-3">
                {sortedIocs.length > 0 ? (
                    <table className="table table-striped table-bordered table-hover mb-0">
                        <thead>
                            <tr>
                                <SortableHeader
                                    label="Type"
                                    sortKey="type"
                                    activeSortKey={sortKey}
                                    activeSortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Value"
                                    sortKey="value"
                                    activeSortKey={sortKey}
                                    activeSortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Category"
                                    sortKey="category"
                                    activeSortKey={sortKey}
                                    activeSortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <SortableHeader
                                    label="Severity"
                                    sortKey="severity"
                                    activeSortKey={sortKey}
                                    activeSortDir={sortDir}
                                    onSort={handleSort}
                                />
                                <th>Tags</th>
                                <SortableHeader
                                    label="Created"
                                    sortKey="creation_time"
                                    activeSortKey={sortKey}
                                    activeSortDir={sortDir}
                                    onSort={handleSort}
                                />
                                {canDelete && <th style={{ width: "1px" }}></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedIocs.map((ioc) => {
                                const searchField = ioc.type;
                                const searchLink = makeSearchLink({
                                    field: searchField,
                                    value: ioc.value,
                                    pathname: context.searchEndpoint,
                                });
                                return (
                                    <tr key={ioc.id}>
                                        <td>
                                            <span className="badge badge-primary">
                                                {ioc.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                to={searchLink}
                                                style={{
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                {ioc.value}
                                            </Link>
                                        </td>
                                        <td>{ioc.category || "-"}</td>
                                        <td>
                                            {ioc.severity ? (
                                                <span
                                                    className={`badge ${severityBadgeClass(ioc.severity)}`}
                                                >
                                                    {ioc.severity}
                                                </span>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                    <td>
                                        {ioc.tags && ioc.tags.length > 0
                                            ? ioc.tags.map((tag) => (
                                                  <Tag
                                                      key={tag}
                                                      tag={tag}
                                                      searchEndpoint={
                                                          context.searchEndpoint
                                                      }
                                                  />
                                              ))
                                            : "-"}
                                    </td>
                                        <td style={{ whiteSpace: "nowrap" }}>
                                            {new Date(
                                                ioc.creation_time
                                            ).toLocaleString()}
                                        </td>
                                        {canDelete && (
                                            <td>
                                                <Link
                                                    to="#"
                                                    className="text-danger"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        requestRemove(ioc.id);
                                                    }}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTimes}
                                                    />
                                                </Link>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-muted">
                        No IOCs linked to this object.
                    </div>
                )}

                {canAdd && (
                    <div className="d-flex justify-content-end mt-3">
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => setAddModalOpen(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} className="mr-1" />
                            Add IOC
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
