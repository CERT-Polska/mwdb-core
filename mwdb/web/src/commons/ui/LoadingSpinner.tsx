import { useMemo } from "react";

type Props = {
    type?:
        | "primary"
        | "secondary"
        | "success"
        | "danger"
        | "danger"
        | "info"
        | "light"
        | "dark";
    loading: boolean;
};

export function LoadingSpinner(props: Props) {
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
