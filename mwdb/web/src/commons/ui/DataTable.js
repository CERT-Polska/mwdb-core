import React from "react";

export default function DataTable(props) {
    let indentLevel = props.indent || 0;
    let indentWidth = `${indentLevel * 8}pt`;

    return (
        <table
            className={`table table-striped table-bordered table-hover data-table ${
                indentLevel > 0 ? "nested" : ""
            }`}
            style={{
                marginLeft: indentWidth,
                width: `calc(100% - ${indentWidth})`,
            }}
        >
            <tbody>{props.children}</tbody>
        </table>
    );
}
