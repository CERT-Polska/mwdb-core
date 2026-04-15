import { useCallback, MouseEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

type Props = {
    attributeKey: string;
    attributeLabel: string;
    collapsed: boolean;
    onCollapse: (val: boolean) => void;
    collapsible: boolean;
    attributesCount: number;
    onShowRaw: (val: boolean) => void;
    showRaw: boolean;
    isRichRendered: boolean;
    children: JSX.Element;
};

export function AttributeRow({
    attributeKey,
    attributeLabel,
    collapsed,
    onCollapse,
    collapsible,
    attributesCount,
    onShowRaw,
    showRaw,
    isRichRendered,
    children,
}: Props) {
    const switchCollapse = useCallback(
        (ev: MouseEvent) => {
            ev.preventDefault();
            if (collapsible) onCollapse(!collapsed);
        },
        [collapsible, collapsed, onCollapse]
    );

    return (
        <tr>
            <th onClick={switchCollapse}>
                {collapsible ? (
                    <FontAwesomeIcon
                        icon={collapsed ? faPlus : faMinus}
                        size="sm"
                    />
                ) : (
                    <></>
                )}{" "}
                <span
                    data-toggle="tooltip"
                    title={attributeKey}
                    style={{ cursor: "pointer" }}
                >
                    {attributeLabel || attributeKey}
                </span>
                {isRichRendered ? (
                    <div
                        style={{
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontWeight: "normal",
                        }}
                        onClick={(ev) => {
                            ev.preventDefault();
                            onShowRaw(!showRaw);
                        }}
                    >
                        Show {showRaw ? "rendered" : "raw"}
                    </div>
                ) : (
                    <></>
                )}
            </th>
            <td className="flickerable">
                {children}
                {collapsible && collapsed ? (
                    <button
                        className="unstyled-btn text-muted"
                        onClick={switchCollapse}
                    >
                        ({attributesCount - 3} more...)
                    </button>
                ) : (
                    <></>
                )}
            </td>
        </tr>
    );
}
