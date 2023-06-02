import { ActionCopyToClipboard } from "@mwdb-web/commons/ui";

type Props = {
    narrowOnly?: boolean;
    wideOnly?: boolean;
    copyable?: boolean;
    label?: string;
    labelWidth?: string;
    icon?: JSX.Element;
    noEllipsis?: boolean;
    value?: string;
    children?: JSX.Element;
};

export function RecentInnerRow(props: Props) {
    const classNames = (
        props.narrowOnly
            ? ["d-lg-none", "d-flex"]
            : props.wideOnly
            ? ["d-none", "d-lg-flex"]
            : ["d-flex"]
    ).concat(props.copyable ? ["flickerable"] : []);
    return (
        <div className={classNames.join(" ")}>
            {props.label && (
                <b style={{ minWidth: props.labelWidth }}>{props.label}: </b>
            )}
            {props.icon}
            <div
                className={!props.noEllipsis ? "recent-field" : ""}
                data-toggle="tooltip"
                title={props.value}
            >
                {props.children || props.value}
            </div>
            {props.copyable && (
                <span className="ml-2">
                    <ActionCopyToClipboard
                        text={props.value ?? ""}
                        tooltipMessage="Copy to clipboard"
                    />
                </span>
            )}
        </div>
    );
}
