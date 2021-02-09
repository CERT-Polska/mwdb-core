import React from "react";

export default function DateString(props) {
    let date = props.date;
    let d = new Date(date);
    return <span>{date != null ? d.toUTCString() : "(never)"}</span>;
}
