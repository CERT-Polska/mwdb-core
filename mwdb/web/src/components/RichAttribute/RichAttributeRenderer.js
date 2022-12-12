import React from "react";
import { renderValue } from "./MarkedMustache";

import { makeContext } from "./exampleTemplates";

export default function RichAttributeRenderer({
    template,
    value,
    setInvalid,
}) {
    let renderedValue, contextValue;
    try {
        contextValue = makeContext(JSON.parse(value));
        renderedValue = renderValue(template, contextValue, {
            searchEndpoint: "/",
        });
        setInvalid(false);
    } catch (e) {
        renderedValue = e.toString();
        contextValue = null;
        setInvalid(true);
    }
    return (
        <tr>
            <th>{"My attribute"}</th>
            <td>{renderedValue}</td>
        </tr>
    );
}
