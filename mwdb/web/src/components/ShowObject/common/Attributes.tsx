import { useContext } from "react";
import { ObjectContext } from "@mwdb-web/commons/context";
import {
    fromPlugins,
    Extendable,
    afterPluginsLoaded,
} from "@mwdb-web/commons/plugins";
import { DataTable } from "@mwdb-web/commons/ui";
import { AttributeRenderer } from "./AttributeRenderer";
import { Attribute, AttributeDefinition } from "@mwdb-web/types/types";

type AttributeNodeProps = {
    attributeKey: string;
    attributes: Attribute[];
    attributeDefinition: AttributeDefinition;
    onRemoveAttribute: (id: number) => void;
    onUpdateAttributes: () => void;
};

let attributeRenderers: Record<
    string,
    React.ComponentType<AttributeNodeProps>
> = {};

afterPluginsLoaded(() => {
    for (let extraRenderers of fromPlugins("attributeRenderers")) {
        attributeRenderers = { ...attributeRenderers, ...extraRenderers };
    }
});

type AttributesObject = Record<string, Attribute[]>;

type AttributeDefinitionsObject = Record<string, AttributeDefinition>;

type Props = {
    attributes: AttributesObject;
    attributeDefinitions: AttributeDefinitionsObject;
    onRemoveAttribute: (id: number) => void;
    onUpdateAttributes: () => void;
};

export function Attributes({
    attributes,
    attributeDefinitions,
    onUpdateAttributes,
    onRemoveAttribute,
}: Props) {
    const context = useContext(ObjectContext);
    const rows = Object.keys(attributes)
        .sort()
        .map((key) => {
            const definition = attributeDefinitions[key];
            if (!definition)
                // definition not yet loaded
                return <></>;
            if (!attributeRenderers[key]) {
                return (
                    <AttributeRenderer
                        key={key}
                        attributes={attributes[key]}
                        attributeDefinition={definition}
                        onRemoveAttribute={onRemoveAttribute}
                    />
                );
            }
            const AttributeNode = attributeRenderers[key];
            return (
                <AttributeNode
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
