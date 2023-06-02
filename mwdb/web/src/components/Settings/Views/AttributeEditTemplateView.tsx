import { useNavigate, useOutletContext } from "react-router-dom";

import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/hooks";

import { RichAttributePreview } from "../../RichAttribute/RichAttributePreview";
import { AttributeOutletContext } from "@mwdb-web/types/context";

export function AttributeEditTemplateView() {
    const { attribute, getAttribute }: AttributeOutletContext =
        useOutletContext();
    const { rich_template: richTemplate, example_value: exampleValue } =
        attribute;
    const navigate = useNavigate();
    const viewAlert = useViewAlert();

    async function storeTemplate(template: string, value: string) {
        try {
            await api.updateAttributeDefinition({
                key: attribute.key,
                rich_template: template,
                example_value: value,
            });
        } catch (error) {
            viewAlert.setAlert({ error });
        } finally {
            getAttribute();
            viewAlert.redirectToAlert({
                target: `/settings/attribute/${attribute.key}`,
                success: "Template edited successfully.",
            });
        }
    }

    function handleCancel() {
        navigate(`/settings/attribute/${attribute.key}`);
    }

    return (
        <div className="container">
            <p>
                Rich templates combine forces of{" "}
                <a href="https://mustache.github.io/mustache.5.html">
                    Mustache
                </a>{" "}
                and{" "}
                <a href="https://www.markdownguide.org/basic-syntax/">
                    Markdown
                </a>{" "}
                languages to give you next level of flexibility in rendering
                attribute values in UI without the need of writing additional
                plugins. Templates allow you to render value objects as custom
                links, lists, tables or combinations of them. You can also
                combine your representation with other context values like
                sample name or hash.
            </p>
            <RichAttributePreview
                storedRichTemplate={richTemplate}
                storedExampleValue={exampleValue}
                onStore={storeTemplate}
                onCancel={() => handleCancel()}
                onDelete={() => storeTemplate("", "")}
            />
        </div>
    );
}
