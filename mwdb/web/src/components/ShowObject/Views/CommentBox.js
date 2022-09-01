import React, { useState, useContext, useEffect, useCallback } from "react";
import readableTime from "readable-timestamp";
import Pagination from "react-js-pagination";

import _ from "lodash";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Identicon, ConfirmationModal } from "@mwdb-web/commons/ui";

function Comment(props) {
    return (
        <li className="media" style={{ overflowWrap: "anywhere" }}>
            <div className="mr-3">
                <Identicon data={props.author} size="45" />
            </div>
            <div className="media-body">
                <h4 className="media-heading user_name">
                    {props.author ? props.author : "(deleted)"}
                </h4>
                <span>
                    {_.flatMap(
                        props.comment.split("\n"),
                        (value, index, array) =>
                            array.length - 1 !== index ? [value, <br />] : value
                    )}
                </span>
                <p>
                    {props.removeComment && (
                        <button
                            className="btn btn-link p-0 remove-comment-link"
                            onClick={() => props.removeComment(props.id)}
                        >
                            Remove
                        </button>
                    )}
                </p>
            </div>
            <p className="float-right">
                <small>{readableTime(new Date(props.timestamp))}</small>
            </p>
        </li>
    );
}

function CommentForm(props) {
    const [text, setText] = useState("");

    function submitForm() {
        props.submitComment(text);
        setText("");
    }

    return (
        <form
            className="commentForm"
            onSubmit={(ev) => {
                ev.preventDefault();
                submitForm();
            }}
        >
            <div className="input-group">
                <textarea
                    className="form-control"
                    placeholder="Say something..."
                    value={text}
                    onChange={(ev) => setText(ev.target.value)}
                    onKeyDown={(evt) =>
                        evt.ctrlKey && evt.keyCode === 13 && submitForm()
                    }
                />
                <div className="input-group-append">
                    <input
                        className="btn btn-outline-primary"
                        type="submit"
                        value="Post"
                    />
                </div>
            </div>
            <div className="form-hint">Press Ctrl+Enter to send comment</div>
        </form>
    );
}

function CommentList({ comments, removeComment }) {
    const itemsCountPerPage = 5;
    const [activePage, setActivePage] = useState(1);

    useEffect(() => {
        if (
            comments &&
            comments.length <= itemsCountPerPage * (activePage - 1)
        ) {
            // Come back to first page if activePage is too big
            setActivePage(1);
        }
    }, [activePage, comments]);

    if (!comments) {
        return <div className="card-body text-muted">Loading data...</div>;
    }

    if (comments.length === 0) {
        return (
            <div className="card-body text-muted">No comments to display</div>
        );
    }
    const commentNodes = comments
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(
            (activePage - 1) * itemsCountPerPage,
            itemsCountPerPage * activePage
        )
        .map((comment, index) => (
            <React.Fragment>
                <Comment
                    id={comment.id}
                    comment={comment.comment}
                    author={comment.author}
                    timestamp={comment.timestamp}
                    removeComment={removeComment}
                    key={index}
                />
                {index < comments.length - 1 ? (
                    <hr
                        style={{ borderTop: "1px solid #bbb", width: "100%" }}
                    />
                ) : (
                    []
                )}
            </React.Fragment>
        ));

    return (
        <div className="card-body">
            <div className="commentList">
                <ul className="list-group list-group-flush">{commentNodes}</ul>
            </div>
            {comments.length > itemsCountPerPage && (
                <Pagination
                    activePage={activePage}
                    itemsCountPerPage={itemsCountPerPage}
                    totalItemsCount={comments.length}
                    pageRangeDisplayed={5}
                    onChange={setActivePage}
                    itemClass="page-item"
                    linkClass="page-link"
                />
            )}
        </div>
    );
}

function CommentBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    const canRemoveComments =
        auth.hasCapability(Capability.removingComments) && !api.remote;
    const canAddComments =
        auth.hasCapability(Capability.addingComments) && !api.remote;

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [commentToRemove, setCommentToRemove] = useState("");

    const objectId = context.object.id;
    const comments = context.object.comments;
    const { setObjectError, updateObjectData } = context;

    async function updateComments() {
        try {
            let response = await api.getObjectComments(objectId);
            updateObjectData({
                comments: response.data,
            });
        } catch (error) {
            setObjectError(error);
        }
    }

    async function submitComment(comment) {
        if (comment) {
            try {
                await api.addObjectComment(objectId, comment);
                await updateComments();
            } catch (error) {
                setObjectError(error);
            }
        }
    }

    async function removeComment(comment_id) {
        try {
            await api.removeObjectComment(objectId, comment_id);
            await updateComments();
        } catch (error) {
            setObjectError(error);
        } finally {
            setDeleteModalOpen(false);
        }
    }

    function handleRemoveComment(comment_id) {
        setDeleteModalOpen(true);
        setCommentToRemove(comment_id);
    }

    const getComments = useCallback(updateComments, [
        api,
        objectId,
        setObjectError,
        updateObjectData,
    ]);

    useEffect(() => {
        getComments();
    }, [getComments]);

    return (
        <div className="card card-default">
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onRequestClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    removeComment(commentToRemove);
                }}
                message="Remove the comment?"
                confirmText="Remove"
            />
            <div className="card-header">Comments</div>
            <CommentList
                comments={comments}
                removeComment={canRemoveComments ? handleRemoveComment : null}
            />
            {canAddComments && <CommentForm submitComment={submitComment} />}
        </div>
    );
}

export default CommentBox;
