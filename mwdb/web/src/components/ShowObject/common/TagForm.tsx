import { useState, useContext } from "react";

import { APIContext } from "@mwdb-web/commons/api";
import { ObjectContext } from "@mwdb-web/commons/context";
import { Autocomplete, Tag } from "@mwdb-web/commons/ui";

type Props = {
    onTagSubmit: (text: string) => void;
};

export function TagForm(props: Props) {
    const api = useContext(APIContext);
    const context = useContext(ObjectContext);
    const [text, setText] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!text) {
            return;
        }
        props.onTagSubmit(text);
        setText("");
        setTags([]);
    }

    async function updateInputValue(value: string) {
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

    const tagItems = text
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
