import { useState } from "react";
import { AttributeValue } from "../common/AttributeValue";
import { AttributeRow } from "../common/AttributeRow";
import { Attribute } from "@mwdb-web/types/types";
import { AttributeDefinition } from "@mwdb-web/types/types";

type Props = {
    attributes: Attribute[];
    attributeDefinition: AttributeDefinition;
    onRemoveAttribute?: (id: number) => void;
};

export function AttributeRenderer({
    attributes,
    attributeDefinition,
    onRemoveAttribute,
}: Props) {
    const [collapsed, setCollapsed] = useState<boolean>(true);
    const [showRaw, setShowRaw] = useState<boolean>(false);
    const isCollapsible = attributes.length > 3;
    const isRichRendered = attributeDefinition.rich_template !== "";
    const visibleAttributes = collapsed ? attributes.slice(0, 3) : attributes;

    return (
        <AttributeRow
            attributeKey={attributeDefinition.key}
            attributeLabel={attributeDefinition.label}
            onCollapse={(collapsed) => setCollapsed(collapsed)}
            collapsed={collapsed}
            collapsible={isCollapsible}
            onShowRaw={(showRaw) => setShowRaw(showRaw)}
            showRaw={showRaw}
            isRichRendered={isRichRendered}
        >
            <>
                {visibleAttributes.map((attribute: Attribute) => (
                    <AttributeValue
                        key={attribute.id}
                        attributeId={attribute.id}
                        value={attribute.value}
                        attributeDefinition={attributeDefinition}
                        onRemove={onRemoveAttribute}
                        showRaw={showRaw}
                    />
                ))}
            </>
        </AttributeRow>
    );
}
