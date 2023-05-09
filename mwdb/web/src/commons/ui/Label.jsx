import React from "react";

export default function Label(props) {
    const { label, required, htmlFor } = props;

    return (
        <label className={required ? "required" : ""} htmlFor={htmlFor}>
            {label}
        </label>
    );
}
