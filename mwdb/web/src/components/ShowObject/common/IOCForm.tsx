import { useState, useImperativeHandle, forwardRef } from "react";

const IOC_TYPES = ["ip", "domain", "url", "port", "email", "hash", "mutex", "registry_key", "user_agent"];
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
        const [tagsInput, setTagsInput] = useState<string>("");

        function doSubmit() {
            if (!value.trim()) return;
            const tags = tagsInput
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0);
            onIOCSubmit(type, value.trim(), category.trim(), severity, tags);
            resetFields();
        }

        function resetFields() {
            setValue("");
            setCategory("");
            setSeverity("");
            setTagsInput("");
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
                <div className="input-group">
                    <input
                        className="form-control"
                        type="text"
                        placeholder="Tags (comma separated)"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                    />
                </div>
            </div>
        );
    }
);
