import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function EditableItem({
    name,
    type,
    selective,
    badge,
    children,
    defaultValue,
    onSubmit,
}) {
    const [value, setValue] = useState(defaultValue);
    const [edit, setEdit] = useState(false);

    return (
        <span>
            {edit ? (
                <div className="input-group">
                    {selective ? (
                        <select
                            className="form-control"
                            value={value}
                            name={name}
                            onChange={(ev) => setValue(ev.target.value)}
                        >
                            {children}
                        </select>
                    ) : (
                        <input
                            type={type || "text"}
                            name={name}
                            className="form-control"
                            value={value}
                            onChange={(ev) => setValue(ev.target.value)}
                        />
                    )}
                    <div className="input-group-append">
                        <button
                            className="btn btn-outline-success"
                            onClick={() => {
                                onSubmit({ [name]: value });
                                setEdit(false);
                            }}
                        >
                            <small>Save </small>
                            <FontAwesomeIcon icon="save" />
                        </button>
                        <button
                            className="btn btn-outline-danger"
                            onClick={() => {
                                setValue(defaultValue);
                                setEdit(false);
                            }}
                        >
                            <small>Cancel </small>
                            <FontAwesomeIcon icon="times" />
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <span
                        className={
                            badge
                                ? "badge badge-secondary align-middle"
                                : "align-middle"
                        }
                    >
                        {defaultValue}
                    </span>
                    <button
                        className="float-right align-middle btn shadow-none"
                        style={{ cursor: "pointer" }}
                        onClick={(ev) => {
                            ev.preventDefault();
                            setValue(defaultValue);
                            setEdit(true);
                        }}
                    >
                        <small className="text-muted">Edit </small>
                        <FontAwesomeIcon icon="edit" />
                    </button>
                </div>
            )}
        </span>
    );
}
