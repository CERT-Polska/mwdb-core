import { useState, useContext, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Pagination from "react-js-pagination";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { Capability, IOCItem } from "@mwdb-web/types/types";
import { makeSearchLink } from "@mwdb-web/commons/helpers";

const ITEMS_PER_PAGE = 5;

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

function IOCListItem({
    ioc,
    searchEndpoint,
    onRemove,
    deletable,
}: {
    ioc: IOCItem;
    searchEndpoint: string;
    onRemove: (id: number) => void;
    deletable: boolean;
}) {
    const searchField = ioc.type;
    const searchLink = makeSearchLink({
        field: searchField,
        value: ioc.value,
        pathname: searchEndpoint,
    });

    return (
        <div
            className="d-flex align-items-start py-2"
            style={{
                borderBottom: "1px solid rgba(0,0,0,.08)",
            }}
        >
            <div className="d-flex flex-wrap align-items-center"
                 style={{ minWidth: 0, flex: 1, gap: "4px" }}>
                <span
                    className="badge badge-primary"
                    style={{
                        minWidth: "45px",
                        textAlign: "center",
                        fontSize: "0.7em",
                    }}
                >
                    {ioc.type.replace(/_/g, " ").toUpperCase()}
                </span>
                <Link
                    to={searchLink}
                    className="mr-1"
                    style={{
                        wordBreak: "break-all",
                    }}
                >
                    {ioc.value}
                </Link>
                {ioc.severity && (
                    <span
                        className={`badge ${severityBadgeClass(ioc.severity)}`}
                        style={{ fontSize: "0.7em", fontWeight: "normal" }}
                    >
                        {ioc.severity}
                    </span>
                )}
                {ioc.category && (
                    <span
                        className="badge badge-outline-secondary"
                        style={{ fontSize: "0.7em", fontWeight: "normal" }}
                    >
                        {ioc.category}
                    </span>
                )}
                {ioc.tags &&
                    ioc.tags.map((tag) => (
                        <span
                            key={tag}
                            className="badge badge-light"
                            style={{
                                border: "1px solid #dee2e6",
                                fontSize: "0.7em",
                                fontWeight: "normal",
                            }}
                        >
                            {tag}
                        </span>
                    ))}
            </div>
            {deletable && (
                <Link
                    to="#"
                    className="text-danger ml-2 mt-1"
                    onClick={(e) => {
                        e.preventDefault();
                        onRemove(ioc.id);
                    }}
                    title="Remove IOC"
                >
                    <FontAwesomeIcon icon={faTimes} />
                </Link>
            )}
        </div>
    );
}

export function IOCBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
    const [iocToRemove, setIocToRemove] = useState<number | null>(null);
    const [activePage, setActivePage] = useState<number>(1);

    const objectId = context.object!.id;
    const iocs = context.object!.iocs || [];
    const { setObjectError, updateObjectData } = context;

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

    async function handleIOCRemove(iocId: number) {
        try {
            if (objectId) {
                const response = await api.removeObjectIOC(objectId, iocId);
                updateObjectData({ iocs: response.data });
                // If the current page is now empty, go back one page
                const remaining = response.data.length;
                const maxPage = Math.max(1, Math.ceil(remaining / ITEMS_PER_PAGE));
                if (activePage > maxPage) {
                    setActivePage(maxPage);
                }
            }
        } catch (error) {
            setObjectError(error);
        } finally {
            setModalIsOpen(false);
        }
    }

    function requestRemove(iocId: number) {
        setIocToRemove(iocId);
        setModalIsOpen(true);
    }

    const iocCount = iocs.length;
    const pageStart = (activePage - 1) * ITEMS_PER_PAGE;
    const pageEnd = pageStart + ITEMS_PER_PAGE;
    const visibleIocs = iocs.slice(pageStart, pageEnd);

    return (
        <div className="card card-default">
            <ConfirmationModal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                onConfirm={() => {
                    if (iocToRemove !== null) handleIOCRemove(iocToRemove);
                }}
                message="Remove this IOC from the object?"
                confirmText="Remove"
            />
            <div className="card-header">
                IOCs{" "}
                {iocCount > 0 && (
                    <span className="badge badge-pill badge-secondary ml-1">
                        {iocCount}
                    </span>
                )}
            </div>
            <div className="card-body py-0 px-3">
                {visibleIocs.length > 0 ? (
                    visibleIocs.map((ioc) => (
                        <IOCListItem
                            key={ioc.id}
                            ioc={ioc}
                            searchEndpoint={context.searchEndpoint}
                            onRemove={requestRemove}
                            deletable={auth.hasCapability(
                                Capability.removingIocs
                            )}
                        />
                    ))
                ) : (
                    <div className="text-muted py-3">No IOCs to display</div>
                )}
            </div>
            {iocCount > ITEMS_PER_PAGE && (
                <div className="card-footer py-1 px-2 d-flex justify-content-center">
                    <Pagination
                        activePage={activePage}
                        itemsCountPerPage={ITEMS_PER_PAGE}
                        totalItemsCount={iocCount}
                        pageRangeDisplayed={3}
                        onChange={setActivePage}
                        itemClass="page-item"
                        linkClass="page-link page-link-sm"
                        innerClass="pagination pagination-sm mb-0"
                    />
                </div>
            )}
        </div>
    );
}
