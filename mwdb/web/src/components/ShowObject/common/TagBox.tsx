import { useState, useContext } from "react";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { TagList } from "@mwdb-web/commons/ui";
import { TagForm } from "./TagForm";
import { Capability } from "@mwdb-web/types/types";

export function TagBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
    const [tagToRemove, setTagToRemove] = useState<string>("");

    const objectId = context.object!.id;
    const tags = context.object!.tags;
    const { setObjectError, updateObjectData } = context;

    async function updateTags() {
        try {
            let response = await api.getObjectTags(objectId!);
            updateObjectData({
                tags: response.data,
            });
        } catch (error) {
            setObjectError(error);
        }
    }

    async function handleTagSubmit(tag: string) {
        try {
            await api.addObjectTag(objectId!, tag);
            await updateTags();
        } catch (error) {
            setObjectError(error);
        }
    }

    async function tagRemove(tag: string) {
        try {
            await api.removeObjectTag(objectId!, tag);
            await updateTags();
        } catch (error) {
            setObjectError(error);
        } finally {
            setModalIsOpen(false);
        }
    }

    function handleTagRemove(tag: string) {
        setModalIsOpen(true);
        setTagToRemove(tag);
    }

    return (
        <div className="card card-default">
            <ConfirmationModal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                onConfirm={(e) => tagRemove(tagToRemove)}
                message={`Remove tag ${tagToRemove}?`}
                confirmText="Remove"
            />
            <div className="card-header">Tags</div>
            <div className="card-body">
                {tags && tags.length > 0 ? (
                    <TagList
                        tag={""}
                        tags={tags}
                        tagRemove={(e, tag) => handleTagRemove(tag)}
                        deletable={auth.hasCapability(Capability.removingTags)}
                        searchEndpoint={context.searchEndpoint}
                    />
                ) : (
                    <div className="text-muted">No tags to display</div>
                )}
            </div>
            {auth.hasCapability(Capability.addingTags) && !api.remote && (
                <TagForm onTagSubmit={handleTagSubmit} />
            )}
        </div>
    );
}
