import React, { useState, useEffect, useContext } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ConfirmationModal } from "@mwdb-web/commons/ui";

import QuickQueryAddModal from "./QuickQueryAddModal";

function QuickQueryItem(props) {
    return (
        <span
            className={`badge badge-${props.color}`}
            style={{ cursor: "pointer" }}
        >
            <span
                data-toggle="tooltip"
                title="Add the Quick query to your search or click on x to delete it"
                onClick={props.onClick}
            >
                {props.label}{" "}
            </span>
            {props.onDelete ? (
                <span
                    data-toggle="tooltip"
                    title="Delete Quick query."
                    onClick={props.onDelete}
                >
                    <FontAwesomeIcon icon="times" pull="right" size="1x" />
                </span>
            ) : (
                []
            )}
        </span>
    );
}

function UploaderQueryItem(props) {
    return (
        <QuickQueryItem
            label="Only uploaded by me"
            color="secondary"
            {...props}
        />
    );
}

export default function QuickQuery(props) {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [idToRemove, setIdToRemove] = useState(null);
    const [queries, setQueries] = useState([]);
    const [modalError, setModalError] = useState(null);

    const updateQueries = async () => {
        try {
            let response = await api.getQuickQueries(props.type);
            setQueries(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const addQuery = async (name) => {
        try {
            await api.addQuickQuery(props.type, name, props.query);
            updateQueries();
            setAddModalOpen(false);
            setModalError(null);
        } catch (error) {
            setModalError(error);
        }
    };

    const deleteQuery = async (id) => {
        try {
            await api.deleteQuickQuery(id);
            setIdToRemove(null);
            setDeleteModalOpen(false);
            updateQueries();
        } catch (error) {
            setModalError(error);
        }
    };

    const predefinedQueryBadges = [
        !api.remote && (
            <UploaderQueryItem
                key="uploaded-by-me"
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
        !api.remote && (
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
                onDelete={(ev) => {
                    ev.preventDefault();
                    setIdToRemove(v.id);
                    setDeleteModalOpen(true);
                }}
            />
        ));

    const newQuickQueryButton = (
        <span
            className="badge badge-success"
            style={{ cursor: "pointer" }}
            data-toggle="tooltip"
            title="Save current search as Quick query"
            onClick={(ev) => {
                ev.preventDefault();
                if (props.canAddQuickQuery) {
                    setAddModalOpen(true);
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

    const userQuickQueryBadges = !api.remote ? (
        <React.Fragment>
            {queryBadges}
            {newQuickQueryButton}
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
                query={props.query}
                error={modalError}
                onError={setModalError}
                onSubmit={addQuery}
                onRequestModalClose={() => {
                    setModalError(null);
                    setAddModalOpen(false);
                }}
            />
        </React.Fragment>
    ) : (
        []
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
