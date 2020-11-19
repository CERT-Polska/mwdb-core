import React, {useState, useEffect} from 'react';
import { connect } from "react-redux";

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {ConfirmationModal} from "@mwdb-web/commons/ui";
import api from "@mwdb-web/commons/api";

import QuickQueryAddModal from "./QuickQueryAddModal";

function QuickQueryItem(props) {
    return (
        <span className={`badge badge-${props.color}`} style={{cursor: "pointer"}}>
            <span data-toggle="tooltip"
                  title="Add the Quick query to your search or click on x to delete it"
                  onClick={props.onClick}>
                  {props.label}{" "}
            </span>
            {
                props.onDelete ? (
                    <span data-toggle="tooltip"
                          title="Delete Quick query."
                          onClick={props.onDelete}>
                        <FontAwesomeIcon icon="times" pull="right" size="1x"/>
                    </span>
                ) : []
            }
        </span>
    )
}

function UploaderQueryItem(props) {
    return (
        <QuickQueryItem label="Only uploaded by me"
                        color="secondary"
                        {...props} />
    )
}

function QuickQuery(props) {
    let [addModalOpen, setAddModalOpen] = useState(false);
    let [deleteModalOpen, setDeleteModalOpen] = useState(false);
    let [idToRemove, setIdToRemove] = useState(null);
    let [queries, setQueries] = useState([]);
    let [modalError, setModalError] = useState(null);

    const updateQueries = async () => {
        try {
            let response = await api.getQuickQueries(props.type)
            setQueries(response.data);
        } catch (error) {
            console.log(error)
        }
    }

    const addQuery = async (name) => {
        try {
            await api.addQuickQuery(props.type, name, props.query)
            updateQueries();
            setAddModalOpen(false);
            setModalError(null);
        } catch (error) {
            setModalError(error);
        }
    }

    const deleteQuery = async (id) => {
        try {
            await api.deleteQuickQuery(id)
            setIdToRemove(null);
            setDeleteModalOpen(false);
            updateQueries();
        } catch (error) {
            setModalError(error);
        }
    }

    const predefinedQueryBadges = [
        <UploaderQueryItem key="uploaded-by-me"
                           onClick={(ev) => {ev.preventDefault(); props.addToQuery("uploader", props.userLogin)}} />,
        <QuickQueryItem key="exclude-public"
                        label="Exclude public"
                        color="secondary"
                        onClick={(ev) => {ev.preventDefault(); props.addToQuery("NOT shared", "public")}} />,
        <QuickQueryItem key="favorites"
                        label="Favorites"
                        color="info"
                        onClick={(ev) => {ev.preventDefault(); props.addToQuery("favorites", props.userLogin)}} />,
        <QuickQueryItem key="exclude-feed"
                        label="Exclude feed:*"
                        color="primary"
                        onClick={(ev) => {ev.preventDefault(); props.addToQuery("NOT tag", "feed:*")}} />,
        <QuickQueryItem key="only-ripped"
                        label="Only ripped:*"
                        color="warning"
                        onClick={(ev) => {ev.preventDefault(); props.addToQuery("tag", "ripped:*")}} />
    ];

    const queryBadges = (
        queries.sort((a, b) => a.id - b.id)
               .map(v => (
                    <QuickQueryItem key={v.id}
                                    label={v.name}
                                    color="dark"
                                    onClick={(ev) => {ev.preventDefault(); props.submitQuery(v.query)}}
                                    onDelete={(ev) => {
                                        ev.preventDefault();
                                        setIdToRemove(v.id); 
                                        setDeleteModalOpen(true);
                                    }}/>
                ))
    );

    const newQuickQueryButton = (
        <span className="badge badge-success" style={{cursor: "pointer"}}
              data-toggle="tooltip"
              title="Save current search as Quick query"
              onClick={(ev) => {
                  ev.preventDefault();
                  if (props.canAddQuickQuery) {
                      setAddModalOpen(true);
                  } else {
                      props.setQueryError("Provided query must be submitted before adding to Quick query bar")
                  }
              }}>Add +</span>
    )

    // Fetch queries on mount
    useEffect(() => {
        updateQueries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="quick-query-bar">
            Quick query:{" "}
            {predefinedQueryBadges}
            {queryBadges}
            {newQuickQueryButton}
            <ConfirmationModal buttonStyle="badge-success"
                               confirmText="Yes"
                               message="Are you sure you want to delete this quick query?"
                               isOpen={deleteModalOpen}
                               onRequestClose={() => setDeleteModalOpen(false)}
                               onConfirm={(ev) => {
                                    ev.preventDefault();
                                    deleteQuery(idToRemove);
                               }}
            />
            <QuickQueryAddModal isOpen={addModalOpen}
                                query={props.query}
                                error={modalError}
                                onError={setModalError}
                                onSubmit={addQuery}
                                onRequestModalClose={
                                    () => {
                                        setModalError(null);
                                        setAddModalOpen(false);
                                    }
                                }
            />
        </div>
    )
}

export default connect(
    (state, ownProps) => ({...ownProps, userLogin: state.auth.loggedUser.login})
)(QuickQuery);
