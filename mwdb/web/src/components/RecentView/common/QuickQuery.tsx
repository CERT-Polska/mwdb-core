import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { Capability } from "@mwdb-web/types/types";

import { QuickQueryAddModal } from "./QuickQueryAddModal";
import { QuickQueryItem } from "./QuickQueryItem";
import { ObjectType, Query } from "@mwdb-web/types/types";
import { isNil } from "lodash";

type Props = {
    type: ObjectType;
    query: string;
    canAddQuickQuery: boolean;
    addToQuery: (query: string, login: string) => void;
    submitQuery: (query: string) => void;
    setQueryError: (error: any) => void;
};

export function QuickQuery(props: Props) {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);

    const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
    const [idToRemove, setIdToRemove] = useState<number | null>(null);
    const [queries, setQueries] = useState<Query[]>([]);
    const [modalError, setModalError] = useState<string>();

    const updateQueries = async () => {
        try {
            let response = await api.getQuickQueries(props.type);
            setQueries(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const addQuery = async (name: string) => {
        try {
            await api.addQuickQuery(props.type, name, props.query);
            updateQueries();
            setAddModalOpen(false);
            setModalError(undefined);
        } catch (error) {
            setModalError(error as string);
        }
    };

    const deleteQuery = async (id: number | null) => {
        if (isNil(id)) {
            return;
        }
        try {
            await api.deleteQuickQuery(id);
            setIdToRemove(null);
            setDeleteModalOpen(false);
            updateQueries();
        } catch (error) {
            setModalError(error as string);
        }
    };

    const checkIfQueryNotExist = () => {
        const isQueriesIncludeNewQuery = queries
            .map((x) => x.query)
            .includes(props.query);
        if (isQueriesIncludeNewQuery) {
            toast("You are trying to add a query that already exists.", {
                type: "error",
            });
            return false;
        }
        return true;
    };

    const predefinedQueryBadges = [
        !api.remote && (
            <QuickQueryItem
                key="uploaded-by-me"
                label="Only uploaded by me"
                color="secondary"
                onClick={(ev) => {
                    ev.preventDefault();
                    props.addToQuery("uploader", auth.user.login);
                }}
            />
        ),
        <QuickQueryItem
            key="exclude-public"
            label="Exclude public"
            color="secondary"
            onClick={(ev) => {
                ev.preventDefault();
                props.addToQuery("NOT shared", "public");
            }}
        />,
        !api.remote && auth.hasCapability(Capability.personalize) && (
            <QuickQueryItem
                key="favorites"
                label="Favorites"
                color="info"
                onClick={(ev) => {
                    ev.preventDefault();
                    props.addToQuery("favorites", auth.user.login);
                }}
            />
        ),
        <QuickQueryItem
            key="exclude-feed"
            label="Exclude feed:*"
            color="primary"
            onClick={(ev) => {
                ev.preventDefault();
                props.addToQuery("NOT tag", "feed:*");
            }}
        />,
        <QuickQueryItem
            key="only-ripped"
            label="Only ripped:*"
            color="warning"
            onClick={(ev) => {
                ev.preventDefault();
                props.addToQuery("tag", "ripped:*");
            }}
        />,
    ];
    const queryBadges = queries
        .sort((a, b) => a.id - b.id)
        .map((v) => (
            <QuickQueryItem
                key={v.id}
                label={v.name}
                color="dark"
                onClick={(ev) => {
                    ev.preventDefault();
                    props.submitQuery(v.query);
                }}
                onDelete={
                    auth.hasCapability(Capability.personalize)
                        ? (ev) => {
                              ev.preventDefault();
                              setIdToRemove(v.id);
                              setDeleteModalOpen(true);
                          }
                        : undefined
                }
            />
        ));

    const newQuickQueryButton = (
        <span
            className="badge badge-success"
            style={{ cursor: "pointer" }}
            data-toggle="tooltip"
            title="Save current search as Quick query"
            onClick={() => {
                if (props.canAddQuickQuery && checkIfQueryNotExist()) {
                    setAddModalOpen(true);
                    props.setQueryError("");
                } else {
                    props.setQueryError(
                        "Provided query must be submitted before adding to Quick query bar"
                    );
                }
            }}
        >
            Add +
        </span>
    );

    const userQuickQueryBadges = !api.remote && (
        <>
            {queryBadges}
            {auth.hasCapability(Capability.personalize)
                ? newQuickQueryButton
                : []}
            <ConfirmationModal
                buttonStyle="badge-success"
                confirmText="Yes"
                message="Are you sure you want to delete this quick query?"
                isOpen={deleteModalOpen}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={(ev) => {
                    ev.preventDefault();
                    deleteQuery(idToRemove);
                }}
            />
            <QuickQueryAddModal
                isOpen={addModalOpen}
                error={modalError}
                onError={setModalError}
                onSubmit={addQuery}
                queries={queries}
                onRequestModalClose={() => {
                    setModalError(undefined);
                    setAddModalOpen(false);
                }}
            />
        </>
    );

    // Fetch queries on mount
    useEffect(() => {
        updateQueries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="quick-query-bar">
            Quick query: {predefinedQueryBadges}
            {userQuickQueryBadges}
        </div>
    );
}
