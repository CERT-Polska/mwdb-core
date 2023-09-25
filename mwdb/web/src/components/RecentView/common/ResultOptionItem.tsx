import { ReactNode, useMemo } from "react";

type Props = {
    key: string;
    url?: string;
    size?: string;
    title: string;
    action?: () => void;
    children?: ReactNode;
    limit?: () => boolean;
    download?: string | (() => string);
};

function resolveDownload(download: string | (() => string)): string {
    if (typeof download === "string") {
        return download;
    }
    return download();
}

export function ResultOptionItem({ children, ...props }: Props) {
    const isLimit = useMemo(() => {
        if (props.limit) return props.limit();
        return false;
    }, [props.limit])

    return (
        <li key={props.key}>
            {!isLimit ? (
            <>
                <a
                    style={{ cursor: "pointer" }}
                    href={props.url ? props.url : undefined}
                    onClick={props.action ? props.action : undefined}
                    download={props.download ? resolveDownload(props.download) : undefined}
                    className={`btn btn-${props.size ? props.size : "sm"} nav-link dropdown-item`}
                >
                    {props.title}
                </a>
                {children}
            </> ) : []
            }
        </li>
    );
}
