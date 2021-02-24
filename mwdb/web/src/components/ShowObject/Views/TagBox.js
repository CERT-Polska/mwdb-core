import React, { useState, useContext, useEffect, useCallback } from "react";
import Autocomplete from "react-autocomplete";

import { APIContext } from "@mwdb-web/commons/api/context";
import { AuthContext } from "@mwdb-web/commons/auth";
import { ObjectContext } from "@mwdb-web/commons/context";
import { ConfirmationModal } from "@mwdb-web/commons/ui";
import { TagList, Tag } from "@mwdb-web/commons/ui";

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
            let response = await api.getTags(value);
            setTags(response.data.map((t) => t.tag));
        } catch (error) {
            context.setObjectError(error);
        }
    }

    let tagItems = text ? tags : [];

    return (
        <form className="tagForm" onSubmit={handleSubmit}>
            <Autocomplete
                value={text}
                inputProps={{ id: "tags-autocomplete" }}
                getItemValue={(item) => item}
                shouldItemRender={(item, value) => {
                    return (
                        item.toLowerCase().indexOf(value.toLowerCase()) !== -1
                    );
                }}
                items={tagItems}
                onChange={(ev) => updateInputValue(ev.target.value)}
                onSelect={(value) => updateInputValue(value)}
                renderInput={(props) => (
                    <div className="input-group">
                        <input
                            {...props}
                            className="form-control"
                            type="text"
                            placeholder="Add tag"
                        />
                        <div className="input-group-append">
                            <input
                                className="btn btn-outline-primary"
                                type="submit"
                                value="Add"
                            />
                        </div>
                    </div>
                )}
                wrapperStyle={{ display: "block" }}
                renderMenu={(children) => (
                    <div
                        className={
                            "dropdown-menu " +
                            (children.length !== 0 ? "show" : "")
                        }
                    >
                        {children.map((c) => (
                            <a
                                key={c}
                                href="#dropdown"
                                className="dropdown-item"
                                style={{ cursor: "pointer" }}
                            >
                                {c}
                            </a>
                        ))}
                    </div>
                )}
                renderItem={(item, isHighlighted) => (
                    <div
                        className={`item ${
                            isHighlighted ? "item-highlighted" : ""
                        }`}
                        key={item}
                    >
                        <Tag
                            tag={item}
                            tagClick={(ev) => ev.preventDefault()}
                        />
                    </div>
                )}
            />
        </form>
    );
}

export default function TagBox() {
    const api = useContext(APIContext);
    const auth = useContext(AuthContext);
    const context = useContext(ObjectContext);
    const [tags, setTags] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(null);
    const [tagToRemove, setTagToRemove] = useState(false);

    async function updateTags() {
        try {
            let response = await api.getObjectTags(context.object.id);
            let tags = response.data;
            setTags(tags);
        } catch (error) {
            context.setObjectError(error);
        }
    }

    async function handleTagSubmit(tag) {
        try {
            await api.addObjectTag(context.object.id, tag);
            updateTags();
        } catch (error) {
            context.setObjectError(error);
        }
    }

    async function tagRemove(tag) {
        try {
            await api.removeObjectTag(context.object.id, tag);
            updateTags();
        } catch (error) {
            context.setObjectError(error);
        } finally {
            setModalIsOpen(false);
        }
    }

    function handleTagRemove(ev, tag) {
        setModalIsOpen(true);
        setTagToRemove(tag);
    }

    const getTags = useCallback(updateTags, [context.object.id]);

    useEffect(() => {
        getTags();
    }, [getTags]);

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
                        deletable={auth.hasCapability("removing_tags")}
                        searchEndpoint={context.searchEndpoint}
                    />
                ) : (
                    <div className="text-muted">No tags to display</div>
                )}
            </div>
            {auth.hasCapability("adding_tags") && !api.remote && (
                <TagForm onTagSubmit={handleTagSubmit} />
            )}
        </div>
    );
}
