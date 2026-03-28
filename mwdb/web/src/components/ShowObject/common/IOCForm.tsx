import { useState, useImperativeHandle, forwardRef } from "react";

import { Tag } from "@mwdb-web/commons/ui";

const IOC_TYPES = ["ip", "domain", "url", "port", "email", "mutex", "registry_key", "user_agent"];
const IOC_SEVERITIES = ["", "low", "medium", "high", "critical"];

type Props = {
    onIOCSubmit: (
        type: string,
        value: string,
        category: string,
        severity: string,
        tags: string[]
    ) => void;
};

export type IOCFormHandle = {
    submit: () => void;
    isValid: () => boolean;
    reset: () => void;
};

export const IOCForm = forwardRef<IOCFormHandle, Props>(
    function IOCForm({ onIOCSubmit }, ref) {
        const [type, setType] = useState<string>("ip");
        const [value, setValue] = useState<string>("");
        const [category, setCategory] = useState<string>("");
        const [severity, setSeverity] = useState<string>("");
        const [tags, setTags] = useState<string[]>([]);
        const [tagInput, setTagInput] = useState<string>("");

        function addTag(raw: string) {
            const tag = raw.trim();
            if (tag && !tags.includes(tag)) {
                setTags((prev) => [...prev, tag]);
            }
            setTagInput("");
        }

        function removeTag(tag: string) {
            setTags((prev) => prev.filter((t) => t !== tag));
        }

        function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
            if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
            }
            if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                setTags((prev) => prev.slice(0, -1));
            }
        }

        function doSubmit() {
            if (!value.trim()) return;
            // Pick up any text left in the tag input
            const finalTags = tagInput.trim()
                ? [...tags, tagInput.trim()]
                : tags;
            onIOCSubmit(type, value.trim(), category.trim(), severity, finalTags);
            resetFields();
        }

        function resetFields() {
            setValue("");
            setCategory("");
            setSeverity("");
            setTags([]);
            setTagInput("");
        }

        useImperativeHandle(ref, () => ({
            submit: doSubmit,
            isValid: () => value.trim().length > 0,
            reset: resetFields,
        }));

        return (
            <div>
                <div className="input-group mb-2">
                    <select
                        className="form-control"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        style={{ maxWidth: "120px" }}
                    >
                        {IOC_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t.replace(/_/g, " ").toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <input
                        className="form-control"
                        type="text"
                        placeholder="Value (e.g., 192.168.1.1)"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>
                <div className="input-group mb-2">
                    <input
                        className="form-control"
                        type="text"
                        placeholder="Category (e.g., c2, malware)"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                    <select
                        className="form-control"
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        style={{ maxWidth: "120px" }}
                    >
                        {IOC_SEVERITIES.map((s) => (
                            <option key={s} value={s}>
                                {s
                                    ? s.charAt(0).toUpperCase() + s.slice(1)
                                    : "Severity"}
                            </option>
                        ))}
                    </select>
                </div>
                <div
                    className="form-control d-flex flex-wrap align-items-center"
                    style={{
                        height: "auto",
                        minHeight: "calc(1.5em + .75rem + 2px)",
                        gap: "4px",
                        cursor: "text",
                    }}
                    onClick={(e) => {
                        // Focus the input when clicking the container
                        const input = (e.currentTarget as HTMLElement).querySelector("input");
                        input?.focus();
                    }}
                >
                    {tags.map((tag) => (
                        <Tag
                            key={tag}
                            tag={tag}
                            searchable={false}
                            deletable
                            tagRemove={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                        />
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                        placeholder={tags.length === 0 ? "Tags (press Enter to add)" : ""}
                        style={{
                            border: "none",
                            outline: "none",
                            flex: 1,
                            minWidth: "80px",
                            padding: 0,
                        }}
                    />
                </div>
            </div>
        );
    }
);
