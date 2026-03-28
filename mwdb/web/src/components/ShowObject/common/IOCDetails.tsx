import { useState, useContext, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";

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

export function IOCDetails() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const [iocs, setIocs] = useState<IOCItem[]>([]);
    const [removeModalOpen, setRemoveModalOpen] = useState<boolean>(false);
    const [iocToRemove, setIocToRemove] = useState<number | null>(null);
    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
    const formRef = useRef<IOCFormHandle>(null);

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
                setIocs(response.data);
                setAddModalOpen(false);
            }
        } catch (error) {
            context.setObjectError(error);
        }
    }

    async function handleIOCRemove(iocId: number) {
        try {
            if (objectId) {
                const response = await api.removeObjectIOC(objectId, iocId);
                setIocs(response.data);
            }
        } catch (error) {
            context.setObjectError(error);
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
                {iocs.length > 0 ? (
                    <table className="table table-striped table-bordered table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Category</th>
                                <th>Severity</th>
                                <th>Tags</th>
                                <th>Created</th>
                                {canDelete && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {iocs.map((ioc) => {
                                const searchField =
                                    ioc.type === "hash"
                                        ? "ioc_hash"
                                        : ioc.type;
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
                                        <td>
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
                                                    />{" "}
                                                    Remove
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
