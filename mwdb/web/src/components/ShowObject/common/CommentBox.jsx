import { useState, useContext, useEffect, useCallback } from "react";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext, Capabilities } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";

export function CommentBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);

    const canRemoveComments =
        auth.hasCapability(Capabilities.removingComments) && !api.remote;
    const canAddComments =
        auth.hasCapability(Capabilities.addingComments) && !api.remote;

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [commentToRemove, setCommentToRemove] = useState("");

    const objectId = context.object.id;
    const comments = context.object.comments;
    const { setObjectError, updateObjectData } = context;

    async function updateComments() {
        try {
            const response = await api.getObjectComments(objectId);
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
