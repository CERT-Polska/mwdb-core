import { AttributeDefinition } from "@mwdb-web/types/types";
import { Link } from "react-router-dom";

type Props = {
    attribute: AttributeDefinition;
};

export function AttributeItem({ attribute }: Props) {
    return (
        <tr>
            <td>
                <Link to={`/settings/attribute/${attribute.key}`}>
                    {attribute.key}
                </Link>
                &nbsp;
                {attribute.label && <span>({attribute.label})</span>}
            </td>
            <td>
                {attribute.description || (
                    <div className="text-muted">(Not defined)</div>
                )}
            </td>
            <td>
                {attribute["url_template"] || (
                    <div className="text-muted">(Not defined)</div>
                )}
            </td>
        </tr>
    );
}
