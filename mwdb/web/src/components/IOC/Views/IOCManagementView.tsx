import {
    useState,
    useContext,
    useEffect,
    useReducer,
    useCallback,
} from "react";
import { Link } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroller";
import { toast } from "react-toastify";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faPlus,
    faSave,
    faTimes,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { View, ConfirmationModal, Tag } from "@mwdb-web/commons/ui";
import { getErrorMessage, makeSearchLink } from "@mwdb-web/commons/helpers";
import { Capability, IOCItem } from "@mwdb-web/types/types";
import { QueryInput } from "@mwdb-web/components/RecentView/common/QueryInput";
import { useIOCQuerySuggestions } from "../common/useIOCQuerySuggestions";

const IOC_SEVERITIES = ["", "low", "medium", "high", "critical"];

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

type ListState = {
    pageToLoad: number;
    loadedPages: number;
    hasMorePages: boolean;
    error: boolean;
    elements: IOCItem[];
};

type ListAction = Partial<ListState> & {
    type: "unload" | "loadNextPage" | "reload" | "pageLoaded" | "error" | "updateElement" | "removeElement";
    element?: IOCItem;
    elementId?: number;
};

function listReducer(state: ListState, action: ListAction): ListState {
    switch (action.type) {
        case "unload":
            return {
                pageToLoad: 0,
                loadedPages: 0,
                hasMorePages: false,
                error: false,
                elements: [],
            };
        case "loadNextPage":
            return { ...state, pageToLoad: state.loadedPages + 1 };
        case "reload":
            return {
                pageToLoad: 1,
                loadedPages: 0,
                hasMorePages: false,
                error: false,
                elements: [],
            };
        case "pageLoaded":
            return {
                ...state,
                loadedPages: state.loadedPages + 1,
                hasMorePages: (action.elements?.length ?? 0) > 0,
                elements: [
                    ...state.elements,
                    ...(action.elements ?? []),
                ],
            };
        case "error":
            return {
                ...state,
                loadedPages: state.loadedPages + 1,
                hasMorePages: false,
                error: true,
            };
        case "updateElement":
            if (!action.element) return state;
            return {
                ...state,
                elements: state.elements.map((el) =>
                    el.id === action.element!.id ? action.element! : el
                ),
            };
        case "removeElement":
            return {
                ...state,
                elements: state.elements.filter(
                    (el) => el.id !== action.elementId
                ),
            };
        default:
            return state;
    }
}

function EditableRow({
    ioc,
    canEdit,
    canDelete,
    onUpdate,
    onDelete,
}: {
    ioc: IOCItem;
    canEdit: boolean;
    canDelete: boolean;
    onUpdate: (id: number, data: { category?: string | null; severity?: string | null; tags?: string[] }) => void;
    onDelete: (id: number) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [category, setCategory] = useState(ioc.category || "");
    const [severity, setSeverity] = useState(ioc.severity || "");
    const [tags, setTags] = useState<string[]>(ioc.tags || []);
    const [tagInput, setTagInput] = useState("");

    function addTag(raw: string) {
        const tag = raw.trim();
        if (tag && !tags.includes(tag)) {
            setTags((prev) => [...prev, tag]);
        }
        setTagInput("");
    }

    function removeTag(tag: string) {
        setTags((prev) => prev.filter((t) => t !== tag));
    }

    function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(tagInput);
        }
        if (e.key === "Backspace" && !tagInput && tags.length > 0) {
            setTags((prev) => prev.slice(0, -1));
        }
    }

    const searchField = ioc.type;
    const searchLink = makeSearchLink({
        field: searchField,
        value: ioc.value,
        pathname: "/",
    });

    function handleSave() {
        const finalTags = tagInput.trim()
            ? [...tags, tagInput.trim()]
            : tags;
        onUpdate(ioc.id, {
            category: category.trim() || null,
            severity: severity || null,
            tags: finalTags,
        });
        setTagInput("");
        setEditing(false);
    }

    function handleCancel() {
        setCategory(ioc.category || "");
        setSeverity(ioc.severity || "");
        setTags(ioc.tags || []);
        setTagInput("");
        setEditing(false);
    }

    if (editing) {
        return (
            <tr>
                <td>
                    <span className="badge badge-primary">
                        {ioc.type.toUpperCase()}
                    </span>
                </td>
                <td>
                    <Link to={searchLink} style={{ wordBreak: "break-all" }}>
                        {ioc.value}
                    </Link>
                </td>
                <td>
                    <input
                        className="form-control form-control-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Category"
                    />
                </td>
                <td>
                    <select
                        className="form-control form-control-sm"
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                    >
                        {IOC_SEVERITIES.map((s) => (
                            <option key={s} value={s}>
                                {s
                                    ? s.charAt(0).toUpperCase() + s.slice(1)
                                    : "None"}
                            </option>
                        ))}
                    </select>
                </td>
                <td>
                    <div
                        className="form-control form-control-sm d-flex flex-wrap align-items-center"
                        style={{
                            height: "auto",
                            minHeight: "calc(1.5em + .5rem + 2px)",
                            gap: "3px",
                            cursor: "text",
                        }}
                        onClick={(e) => {
                            const input = (e.currentTarget as HTMLElement).querySelector("input");
                            input?.focus();
                        }}
                    >
                        {tags.map((tag) => (
                            <Tag
                                key={tag}
                                tag={tag}
                                searchable={false}
                                deletable
                                tagRemove={(e) => {
                                    e.stopPropagation();
                                    removeTag(tag);
                                }}
                            />
                        ))}
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                            placeholder={tags.length === 0 ? "Tags (Enter to add)" : ""}
                            style={{
                                border: "none",
                                outline: "none",
                                flex: 1,
                                minWidth: "60px",
                                padding: 0,
                                fontSize: "inherit",
                            }}
                        />
                    </div>
                </td>
                <td>
                    {new Date(ioc.creation_time).toLocaleString()}
                </td>
                <td>
                    <button
                        className="btn btn-sm btn-success mr-1"
                        onClick={handleSave}
                        title="Save"
                    >
                        <FontAwesomeIcon icon={faSave} />
                    </button>
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={handleCancel}
                        title="Cancel"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </td>
            </tr>
        );
    }

    return (
        <tr>
            <td>
                <span className="badge badge-primary">
                    {ioc.type.toUpperCase()}
                </span>
            </td>
            <td>
                <Link to={searchLink} style={{ wordBreak: "break-all" }}>
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
                          <Tag key={tag} tag={tag} searchEndpoint="/" />
                      ))
                    : "-"}
            </td>
            <td>{new Date(ioc.creation_time).toLocaleString()}</td>
            <td>
                {canEdit && (
                    <button
                        className="btn btn-sm btn-outline-primary mr-1"
                        onClick={() => setEditing(true)}
                        title="Edit"
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </button>
                )}
                {canDelete && (
                    <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelete(ioc.id)}
                        title="Delete"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                )}
            </td>
        </tr>
    );
}

export function IOCManagementView() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const [listState, listDispatch] = useReducer(listReducer, {
        pageToLoad: 1,
        loadedPages: 0,
        elements: [],
        hasMorePages: false,
        error: false,
    });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [iocToDelete, setIocToDelete] = useState<number | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [activeQuery, setActiveQuery] = useState("");
    const [suggestions, loadingSuggestions] = useIOCQuerySuggestions(searchInput);

    const pendingLoad = listState.pageToLoad > listState.loadedPages;
    const hasMore = listState.hasMorePages && !pendingLoad;

    const canEdit = auth.hasCapability(Capability.addingIocs);
    const canDelete = auth.hasCapability(Capability.removingIocs);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setActiveQuery(searchInput);
        listDispatch({ type: "reload" });
    }

    function handleClear() {
        setSearchInput("");
        setActiveQuery("");
        listDispatch({ type: "reload" });
    }

    useEffect(() => {
        let cancelled = false;
        if (!pendingLoad) return;

        const lastElement = listState.elements.slice(-1)[0];
        const olderThan = lastElement ? lastElement.id : undefined;

        api.getIOCList(olderThan, 20, activeQuery)
            .then((response) => {
                if (cancelled) return;
                listDispatch({
                    type: "pageLoaded",
                    elements: response.data.iocs,
                });
            })
            .catch((error) => {
                if (cancelled) return;
                toast(getErrorMessage(error), { type: "error" });
                listDispatch({ type: "error" });
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listState.pageToLoad, listState.loadedPages, activeQuery]);

    const handleUpdate = useCallback(
        async (
            iocId: number,
            data: {
                category?: string | null;
                severity?: string | null;
                tags?: string[];
            }
        ) => {
            try {
                const response = await api.updateIOC(iocId, data);
                listDispatch({
                    type: "updateElement",
                    element: response.data,
                });
                toast("IOC updated", { type: "success" });
            } catch (error) {
                toast(getErrorMessage(error), { type: "error" });
            }
        },
        [api]
    );

    const handleDelete = useCallback(
        async (iocId: number) => {
            try {
                await api.deleteIOC(iocId);
                listDispatch({ type: "removeElement", elementId: iocId });
                toast("IOC deleted", { type: "success" });
            } catch (error) {
                toast(getErrorMessage(error), { type: "error" });
            } finally {
                setDeleteModalOpen(false);
            }
        },
        [api]
    );

    function requestDelete(iocId: number) {
        setIocToDelete(iocId);
        setDeleteModalOpen(true);
    }

    const tableStyle: React.CSSProperties = { tableLayout: "fixed" };

    return (
        <View fluid ident="iocManagement">
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    if (iocToDelete !== null) handleDelete(iocToDelete);
                }}
                message="Permanently delete this IOC?"
                confirmText="Delete"
            />
            <h2>IOC Management</h2>
            <form
                className="searchForm mb-3"
                onSubmit={handleSearch}
            >
                <div className="input-group dropdown">
                    <div className="input-group-prepend">
                        <input
                            className="btn btn-outline-danger"
                            type="button"
                            value="X"
                            onClick={(e) => {
                                e.preventDefault();
                                handleClear();
                            }}
                        />
                    </div>
                    <QueryInput
                        value={searchInput}
                        onChange={(val) => setSearchInput(val)}
                        onSubmit={() => handleSearch(
                            { preventDefault: () => {} } as React.FormEvent
                        )}
                        suggestions={suggestions}
                        loadingSuggestions={loadingSuggestions}
                    />
                    <div className="input-group-append">
                        <input
                            className="btn btn-outline-success"
                            type="submit"
                            value="Search"
                        />
                    </div>
                </div>
            </form>
            <table
                className="table table-striped table-bordered table-hover wrap-table"
                style={tableStyle}
            >
                <thead>
                    <tr>
                        <th style={{ width: "8%" }}>Type</th>
                        <th style={{ width: "22%" }}>Value</th>
                        <th style={{ width: "12%" }}>Category</th>
                        <th style={{ width: "10%" }}>Severity</th>
                        <th style={{ width: "20%" }}>Tags</th>
                        <th style={{ width: "15%" }}>Created</th>
                        <th style={{ width: "13%" }}>Actions</th>
                    </tr>
                </thead>
                <InfiniteScroll
                    loadMore={() => {
                        if (!hasMore) return;
                        listDispatch({ type: "loadNextPage" });
                    }}
                    hasMore={hasMore}
                    element={"tbody"}
                >
                    {listState.elements.map((ioc) => (
                        <EditableRow
                            key={ioc.id}
                            ioc={ioc}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onUpdate={handleUpdate}
                            onDelete={requestDelete}
                        />
                    ))}
                    {pendingLoad && (
                        <tr key="loading">
                            <td colSpan={7} className="text-center">
                                Loading...
                            </td>
                        </tr>
                    )}
                    {!pendingLoad &&
                        listState.elements.length === 0 &&
                        !listState.error && (
                            <tr key="empty">
                                <td colSpan={7} className="text-center">
                                    No IOCs found.
                                </td>
                            </tr>
                        )}
                    {listState.error && (
                        <tr key="error">
                            <td colSpan={7} className="text-center">
                                Failed to load IOCs.
                            </td>
                        </tr>
                    )}
                </InfiniteScroll>
            </table>
        </View>
    );
}
