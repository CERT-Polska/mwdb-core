import React, { useCallback, useRef} from "react";

import "bootstrap-select";
import "bootstrap-select/dist/css/bootstrap-select.css";
import $ from "jquery";

export default function BootstrapSelect({children, ...props}) {
    const ref = useRef(null)
    const setRef = useCallback(node => {
        // Initialize the select element with 'selectpicker' plugin
        if(!ref.current && node)
            $(node).selectpicker();
        // Save a reference to the node
        ref.current = node
      }, [])

    return (
        <select ref={setRef} {...props}>
            {children}
        </select>
    )
}