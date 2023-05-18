import React, { useState, useContext } from "react";

import { APIContext } from "@mwdb-web/commons/api";
import { AuthContext, Capability } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { Autocomplete, TagList, Tag } from "@mwdb-web/commons/ui";

function TagForm(props) {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);
    const [text, setText] = useState("");
    const [tags, setTags] = useState([]);

    function handleSubmit(e) {
        e.preventDefault();
        if (!text) {
            return;
        }
        props.onTagSubmit(text);
        setText("");
        setTags([]);
    }

    async function updateInputValue(value) {
        setText(value);
        if (!text) {
            return;
        }
        try {
            const response = await api.getTags(value);
            setTags(response.data.map((t) => t.tag));
        } catch (error) {
            context.setObjectError(error);
        }
    }

    let tagItems = text
        ? tags.filter(
              (item) => item.toLowerCase().indexOf(text.toLowerCase()) !== -1
          )
        : [];

    return (
        <form className="tagForm" onSubmit={handleSubmit}>
            <Autocomplete
                value={text}
                items={tagItems}
                onChange={(value) => updateInputValue(value)}
                renderItem={({ item }) => (
                    <Tag tag={item} tagClick={(ev) => ev.preventDefault()} />
                )}
                className="form-control"
                type="text"
                placeholder="Add tag"
            >
                <div className="input-group-append">
                    <input
                        className="btn btn-outline-primary"
                        type="submit"
                        value="Add"
                    />
                </div>
            </Autocomplete>
        </form>
    );
}

export default function TagBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [tagToRemove, setTagToRemove] = useState(false);

    const objectId = context.object.id;
    const tags = context.object.tags;
    const { setObjectError, updateObjectData } = context;

    async function updateTags() {
        try {
            let response = await api.getObjectTags(objectId);
            updateObjectData({
                tags: response.data,
            });
        } catch (error) {
            setObjectError(error);
        }
    }

    async function handleTagSubmit(tag) {
        try {
            await api.addObjectTag(objectId, tag);
            await updateTags();
        } catch (error) {
            setObjectError(error);
        }
    }

    async function tagRemove(tag) {
        try {
            await api.removeObjectTag(objectId, tag);
            await updateTags();
        } catch (error) {
            setObjectError(error);
        } finally {
            setModalIsOpen(false);
        }
    }

    function handleTagRemove(ev, tag) {
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
                {tags.length > 0 ? (
                    <TagList
                        tags={tags}
                        tagRemove={handleTagRemove}
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
