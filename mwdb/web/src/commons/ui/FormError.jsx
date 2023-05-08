import React from "react";
import { isNil } from "lodash";

export default function FormError(props) {
    const { errorField } = props;
    if (isNil(errorField)) {
        return <></>;
    }

    return (
        <div className="invalid-feedback" style={{ display: "block" }}>
            {errorField.message}
        </div>
    );
}
