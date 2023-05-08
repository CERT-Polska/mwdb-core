import React, { useMemo } from "react";

export default function LoadingSpinner(props) {
    //types is one of: [primary, secondary, success, danger, warning, info, light, dark]
    const { loading, type } = props;
    if (!loading) {
        return <></>;
    }

    const className = useMemo(() => {
        return `spinner-border ${
            type ? `text-${type}` : ""
        } mr-2 spinner-border-sm`.trim();
    }, [type]);

    return (
        <span className={className} role="status">
            <span className="sr-only">Loading...</span>
        </span>
    );
}
