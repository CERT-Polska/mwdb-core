import { useState, useContext, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
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
    const searchField = ioc.type === "hash" ? "ioc_hash" : ioc.type;
    const searchLink = makeSearchLink({
        field: searchField,
        value: ioc.value,
        pathname: searchEndpoint,
    });

    return (
        <div className="d-flex align-items-center mb-1">
            <span
                className="badge badge-primary mr-1"
                style={{ minWidth: "55px", textAlign: "center" }}
            >
                {ioc.type.toUpperCase()}
            </span>
            <Link to={searchLink} className="mr-1" style={{ wordBreak: "break-all" }}>
                {ioc.value}
            </Link>
            {ioc.severity && (
                <span
                    className={`badge ${severityBadgeClass(ioc.severity)} mr-1`}
                >
                    {ioc.severity}
                </span>
            )}
            {ioc.category && (
                <span className="badge badge-outline-secondary mr-1">
                    {ioc.category}
                </span>
            )}
            {deletable && (
                <Link
                    to="#"
                    className="ml-auto text-danger"
                    onClick={(e) => {
                        e.preventDefault();
                        onRemove(ioc.id);
                    }}
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
    const [iocs, setIocs] = useState<IOCItem[]>([]);
    const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
    const [iocToRemove, setIocToRemove] = useState<number | null>(null);

    const objectId = context.object!.id;

    const loadIOCs = useCallback(async () => {
        try {
            if (objectId) {
                const response = await api.getObjectIOCs(objectId);
                setIocs(response.data);
            }
        } catch (error) {
            context.setObjectError(error);
        }
    }, [api, objectId, context.setObjectError]);

    useEffect(() => {
        loadIOCs();
    }, [loadIOCs]);

    async function handleIOCRemove(iocId: number) {
        try {
            if (objectId) {
                const response = await api.removeObjectIOC(objectId, iocId);
                setIocs(response.data);
            }
        } catch (error) {
            context.setObjectError(error);
        } finally {
            setModalIsOpen(false);
        }
    }

    function requestRemove(iocId: number) {
        setIocToRemove(iocId);
        setModalIsOpen(true);
    }

    const iocCount = iocs.length;

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
                IOCs {iocCount > 0 && <span className="badge badge-pill badge-secondary ml-1">{iocCount}</span>}
            </div>
            <div className="card-body">
                {iocs.length > 0 ? (
                    iocs.map((ioc) => (
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
                    <div className="text-muted">No IOCs to display</div>
                )}
            </div>
        </div>
    );
}
