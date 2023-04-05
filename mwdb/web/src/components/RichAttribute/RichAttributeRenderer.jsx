import React from "react";
import { renderValue } from "./MarkedMustache";

import { makeContext } from "./exampleTemplates";

export default function RichAttributeRenderer({ template, value, setInvalid }) {
    let renderedValue;
    try {
        renderedValue = renderValue(template, makeContext(JSON.parse(value)), {
            searchEndpoint: "/",
        });
        setInvalid(false);
    } catch (e) {
        renderedValue = e.toString();
        setInvalid(true);
    }
    return renderedValue;
}
