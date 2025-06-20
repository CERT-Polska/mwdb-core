import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

type Props = {
    attributeKey: string;
    attributeLabel: string;
    collapsed: boolean;
    onCollapse: (val: boolean) => void;
    collapsible: boolean;
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
    onShowRaw,
    showRaw,
    isRichRendered,
    children,
}: Props) {
    return (
        <tr>
            <th
                onClick={(ev) => {
                    ev.preventDefault();
                    if (collapsible) onCollapse(!collapsed);
                }}
            >
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
                    <span style={{ color: "gray", fontWeight: "bold" }}>
                        ...
                    </span>
                ) : (
                    <></>
                )}
            </td>
        </tr>
    );
}
