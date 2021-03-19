import React, { useState, useContext, useEffect, useCallback } from "react";
import readableTime from "readable-timestamp";
import Pagination from "react-js-pagination";

import _ from "lodash";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Identicon, ConfirmationModal } from "@mwdb-web/commons/ui";

function Comment(props) {
    return (
        <li className="media" style={{ wordBreak: "break-all" }}>
            <div className="align-self-center mr-3">
                <Identicon data={props.author} size="45" />
            </div>
            <div className="media-body">
                <h4 className="media-heading user_name">{props.author}</h4>
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

function CommentList(props) {
    const commentNodes = props.data.map((comment, index) => (
        <Comment
            id={comment.id}
            comment={comment.comment}
            author={comment.author}
            timestamp={comment.timestamp}
            removeComment={props.removeComment}
            key={index}
        />
    ));
    return (
        <div className="commentList">
            {commentNodes.length > 0 ? (
                <ul className="list-group list-group-flush">{commentNodes}</ul>
            ) : (
                <div className="text-muted">No comments to display</div>
            )}
        </div>
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

function CommentBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const itemsCountPerPage = 5;

    const canRemoveComments =
        auth.hasCapability("removing_comments") && !api.remote;
    const canAddComments = auth.hasCapability("adding_comments") && !api.remote;

    const [comments, setComments] = useState([]);
    const [activePage, setActivePage] = useState(1);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [commentToRemove, setCommentToRemove] = useState("");

    async function updateComments() {
        try {
            let response = await api.getObjectComments(context.object.id);
            setComments(response.data);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    async function submitComment(comment) {
        if (comment) {
            try {
                await api.addObjectComment(context.object.id, comment);
                updateComments();
            } catch (error) {
                context.setObjectError(error);
            }
        }
    }

    async function removeComment(comment_id) {
        try {
            await api.removeObjectComment(context.object.id, comment_id);
            updateComments();
        } catch (error) {
            context.setObjectError(error);
        } finally {
            setDeleteModalOpen(false);
        }
    }

    function handleRemoveComment(comment_id) {
        setDeleteModalOpen(true);
        setCommentToRemove(comment_id);
    }

    const getComments = useCallback(updateComments, [context.object.id]);

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
            <div className="card-body">
                <CommentList
                    removeComment={
                        canRemoveComments ? handleRemoveComment : null
                    }
                    data={comments
                        .sort(function (a, b) {
                            return (
                                new Date(b.timestamp) - new Date(a.timestamp)
                            );
                        })
                        .slice(
                            (activePage - 1) * itemsCountPerPage,
                            itemsCountPerPage * activePage
                        )}
                />
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
            {canAddComments && <CommentForm submitComment={submitComment} />}
        </div>
    );
}

export default CommentBox;
