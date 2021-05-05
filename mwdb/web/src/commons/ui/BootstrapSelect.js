import React, { useCallback, useLayoutEffect, useRef } from "react";

import "bootstrap-select";
import "bootstrap-select/dist/css/bootstrap-select.css";
import $ from "jquery";

export default function BootstrapSelect({
    children,
    onChange,
    noneSelectedText,
    ...props
}) {
    const ref = useRef(null);
    const setRef = useCallback((node) => {
        // Initialize the select element when mounted
        if (node) {
            const selectElement = $(node);
            selectElement.selectpicker();
        }
        // Save a reference to the node
        ref.current = node;
    }, []);

    useLayoutEffect(() => {
        // Bind onChange event handler and unbind the old/unmounted one
        const selectElement = $(ref.current);
        selectElement.on("changed.bs.select", onChange);
        return () => {
            selectElement.off("changed.bs.select", onChange);
        };
    }, [onChange]);

    useLayoutEffect(() => {
        // Re-render selectpicker when props are changed
        // FIX: noneSelectedText doesn't update on refresh itself
        $(ref.current).selectpicker({ noneSelectedText });
        $(ref.current).selectpicker("refresh");
    }, [props, noneSelectedText]);

    return (
        <select ref={setRef} {...props}>
            {children}
        </select>
    );
}
