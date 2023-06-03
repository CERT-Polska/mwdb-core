import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTrash } from "@fortawesome/free-solid-svg-icons";

import { ActionCopyToClipboard } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { useNavigate } from "react-router-dom";
import { RichAttributeValue } from "../common/RichAttributeValue";

type Props = {
    value: string;
    attributeId: number;
    attributeDefinition: {
        url_template: string;
        rich_template: string;
        key: string;
    };
    onRemove: (id: number) => void;
};

export function AttributeValue({
    value,
    attributeId,
    attributeDefinition,
    onRemove,
}: Props) {
    const {
        url_template: urlTemplate,
        rich_template: richTemplate,
        key,
    } = attributeDefinition;
    const navigate = useNavigate();

    let valueRender: JSX.Element;
    let valueRaw: string;

    if (richTemplate !== "") {
        valueRender = (
            <RichAttributeValue
                attributeDefinition={attributeDefinition}
                value={value}
            />
        );
    } else if (typeof value === "string") {
        // URL templates are supported only for string values
        const url = urlTemplate ? urlTemplate.replace("$value", value) : null;
        if (url) {
            valueRender = <a href={url}>{value}</a>;
        } else {
            valueRender = <span>{value}</span>;
        }
        valueRaw = value;
    } else {
        valueRender = (
            <pre className="attribute-object">
                {"(object)"} {JSON.stringify(value, null, 4)}
            </pre>
        );
    }

    if (typeof value === "string") {
        valueRaw = value;
    } else {
        valueRaw = JSON.stringify(value);
    }

    return (
        <div className="d-flex">
            {valueRender}
            <div className="d-flex align-items-center">
                <span className="ml-2">
                    <ActionCopyToClipboard
                        text={valueRaw}
                        tooltipMessage="Copy value to clipboard"
                    />
                </span>
                {typeof value === "string" && (
                    <span
                        className="ml-2"
                        data-toggle="tooltip"
                        title="Search for that attribute values"
                        onClick={(ev) => {
                            ev.preventDefault();
                            navigate(
                                makeSearchLink({
                                    field: `attribute.${key}`,
                                    value: valueRaw,
                                    pathname: "/search",
                                })
                            );
                        }}
                    >
                        <i>
                            <FontAwesomeIcon
                                icon={faSearch}
                                size="sm"
                                style={{ cursor: "pointer" }}
                            />
                        </i>
                    </span>
                )}
                {onRemove && (
                    <span
                        className="ml-2"
                        data-toggle="tooltip"
                        title="Remove attribute value from this object"
                        onClick={() => onRemove(attributeId)}
                    >
                        <i>
                            <FontAwesomeIcon
                                icon={faTrash}
                                size="sm"
                                style={{ cursor: "pointer" }}
                            />
                        </i>
                    </span>
                )}
            </div>
        </div>
    );
}
