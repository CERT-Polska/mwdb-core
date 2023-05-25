import { useContext } from "react";
import { ObjectContext } from "@mwdb-web/commons/context";
import { renderValue } from "../../RichAttribute/MarkedMustache";
import { AttributeDefinition } from "@mwdb-web/types/types";

type Props = {
    attributeDefinition: Pick<AttributeDefinition, "rich_template" | "key">;
    value: string;
};

export function RichAttributeValue({ attributeDefinition, value }: Props) {
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
