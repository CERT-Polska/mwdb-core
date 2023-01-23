import React, { useContext, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faMinus,
    faSearch,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { ObjectContext } from "@mwdb-web/commons/context";
import {
    fromPlugins,
    Extendable,
    afterPluginsLoaded,
} from "@mwdb-web/commons/plugins";
import { DataTable, ActionCopyToClipboard } from "@mwdb-web/commons/ui";
import { makeSearchLink } from "@mwdb-web/commons/helpers";
import { useNavigate } from "react-router-dom";
import { renderValue } from "../../RichAttribute/MarkedMustache";

let attributeRenderers = {};

afterPluginsLoaded(() => {
    for (let extraRenderers of fromPlugins("attributeRenderers")) {
        attributeRenderers = { ...attributeRenderers, ...extraRenderers };
    }
});

function RichAttributeValue({ attributeDefinition, value }) {
    const { rich_template: richTemplate, key } = attributeDefinition;
    const object = useContext(ObjectContext);
    try {
        const context = {
            key,
            value,
            object: object.object,
        };
        return renderValue(richTemplate, context, {
            searchEndpoint: object.searchEndpoint,
        });
    } catch (e) {
        return (
            <pre className="attribute-object" style={{ color: "red" }}>
                {"(template error)"} {JSON.stringify(value, null, 4)}
            </pre>
        );
    }
}

function AttributeValue({ value, attributeId, attributeDefinition, onRemove }) {
    const {
        url_template: urlTemplate,
        rich_template: richTemplate,
        key,
    } = attributeDefinition;
    const navigate = useNavigate();

    let valueRender, valueRaw;

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

function AttributeRow({
    attributeKey,
    attributeLabel,
    collapsed,
    onCollapse,
    collapsible,
    children,
}) {
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
                    []
                )}{" "}
                <span
                    data-toggle="tooltip"
                    title={attributeKey}
                    style={{ cursor: "pointer" }}
                >
                    {attributeLabel || attributeKey}
                </span>
            </th>
            <td className="flickerable">
                {children}
                {collapsible && collapsed ? (
                    <span style={{ color: "gray", fontWeight: "bold" }}>
                        ...
                    </span>
                ) : (
                    []
                )}
            </td>
        </tr>
    );
}

function AttributeRenderer({
    attributes,
    attributeDefinition,
    onUpdateAttributes,
    onRemoveAttribute,
}) {
    const [collapsed, setCollapsed] = useState(true);
    const isCollapsible = attributes.length > 3;
    const visibleAttributes = collapsed ? attributes.slice(0, 3) : attributes;

    return (
        <AttributeRow
            attributeKey={attributeDefinition.key}
            attributeLabel={attributeDefinition.label}
            onCollapse={(collapsed) => setCollapsed(collapsed)}
            collapsed={collapsed}
            collapsible={isCollapsible}
        >
            {visibleAttributes.map((attribute) => (
                <AttributeValue
                    key={attribute.id}
                    attributeId={attribute.id}
                    value={attribute.value}
                    attributeDefinition={attributeDefinition}
                    onRemove={onRemoveAttribute}
                />
            ))}
        </AttributeRow>
    );
}

export default function Attributes({
    attributes,
    attributeDefinitions,
    onUpdateAttributes,
    onRemoveAttribute,
}) {
    const context = useContext(ObjectContext);
    const rows = Object.keys(attributes)
        .sort()
        .map((key) => {
            const definition = attributeDefinitions[key];
            if (!definition)
                // definition not yet loaded
                return [];
            let Attribute = attributeRenderers[key] || AttributeRenderer;
            return (
                <Attribute
                    key={key}
                    attributeKey={key}
                    attributeDefinition={definition}
                    attributes={attributes[key]}
                    onUpdateAttributes={onUpdateAttributes}
                    onRemoveAttribute={onRemoveAttribute}
                />
            );
        });
    return (
        <Extendable
            ident="attributesList"
            attributes={attributes}
            onUpdateAttributes={onUpdateAttributes}
            object={context.object}
        >
            {rows.length > 0 ? (
                <DataTable>{rows}</DataTable>
            ) : (
                <div className="card-body text-muted">
                    No attributes to display
                </div>
            )}
        </Extendable>
    );
}
