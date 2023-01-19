import React from "react";

export default function Hash(props) {
    if (!props.hash) return [];
    if (props.inline) {
        return <span className="text-monospace">{props.hash}</span>;
    }
    return (
        <div className="smart-ellipsis text-monospace">
            <div className="start">{props.hash.slice(0, -12)}</div>
            <div className="end">{props.hash.slice(-12)}</div>
        </div>
    );
}
