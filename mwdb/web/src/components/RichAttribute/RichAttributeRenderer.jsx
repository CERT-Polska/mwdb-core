import { useEffect, useState } from "react";
import { renderValue } from "./MarkedMustache";

import { makeContext } from "./exampleTemplates";

export default function RichAttributeRenderer({ template, value, setInvalid }) {
    const [renderResult, setRenderResult] = useState(<></>);

    useEffect(() => {
        try {
            const renderedValue = renderValue(
                template,
                makeContext(JSON.parse(value)),
                {
                    searchEndpoint: "/",
                }
            );
            setRenderResult(renderedValue);
            setInvalid(false);
        } catch (e) {
            setRenderResult(e.toString());
            if (setInvalid) {
                setInvalid(true);
            }
        }
    }, [template, value]);

    return renderResult;
}
