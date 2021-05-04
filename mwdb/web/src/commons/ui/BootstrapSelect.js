import React, { useCallback, useRef} from "react";

import "bootstrap-select";
import "bootstrap-select/dist/css/bootstrap-select.css";
import $ from "jquery";

export default function BootstrapSelect({children, onChange, ...props}) {
    const ref = useRef(null)
    const doOnChange = useCallback(onChange || (()=>{}), []);
    const setRef = useCallback(node => {
        // Initialize the select element with 'selectpicker' plugin
        if(!ref.current && node) {
            const selectElement = $(node);
            selectElement.selectpicker();
            selectElement.on('changed.bs.select', doOnChange);
        }
        // Deinitialize the select element otherwise
        if(ref.current && !node) {
            const selectElement = $(ref.current);
            selectElement.off('changed.bs.select', doOnChange);
        }
        // Save a reference to the node
        ref.current = node
      }, [doOnChange])

    return (
        <select ref={setRef} {...props}>
            {children}
        </select>
    )
}