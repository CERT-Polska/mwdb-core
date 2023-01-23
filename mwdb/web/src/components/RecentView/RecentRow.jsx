import React from "react";

function getRecentRowClass(date) {
    let delta = new Date() - new Date(date);
    if (delta < 24 * 60 * 60 * 1000) return "today";
    if (delta < 72 * 60 * 60 * 1000) return "recent";
}

export default function RecentRow(props) {
    return (
        <tr className={`d-flex ${getRecentRowClass(props.firstSeen)}`}>
            {props.children}
        </tr>
    );
}
