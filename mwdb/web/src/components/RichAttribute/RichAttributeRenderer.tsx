import { useEffect, useState } from "react";
import { renderValue } from "./MarkedMustache";

import { makeContext } from "./exampleTemplates";

type Props = {
    template: string;
    value: string;
    setInvalid: (valid: boolean) => void;
};

export function RichAttributeRenderer({ template, value, setInvalid }: Props) {
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
        } catch (e: any) {
            setRenderResult(e.toString());
            if (setInvalid) {
                setInvalid(true);
            }
        }
    }, [template, value]);

    return renderResult;
}
