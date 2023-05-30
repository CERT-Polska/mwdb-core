import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@mwdb-web/commons/api";
import { PagedList } from "@mwdb-web/commons/ui";
import { useViewAlert } from "@mwdb-web/commons/hooks";
import { AttributeItem } from "../common/AttributeItem";
import { AttributeDefinition } from "@mwdb-web/types/types";

export function AttributesListView() {
    const { setAlert } = useViewAlert();
    const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
    const [activePage, setActivePage] = useState<number>(1);
    const [attributeFilter, setAttributeFilter] = useState<string>("");

    const query = attributeFilter.toLowerCase();
    const items = attributes
        .filter((attribute) => attribute.key.toLowerCase().includes(query))
        .sort((attrA, attrB) => attrA.key.localeCompare(attrB.key));

    useEffect(() => {
        getAttributes();
    }, []);

    async function getAttributes() {
        try {
            const response = await api.getAttributeDefinitions("manage");
            setAttributes(
                response.data.attribute_definitions.map((attribute) => ({
                    ...attribute,
                }))
            );
        } catch (error) {
            setAlert({ error });
        }
    }

    return (
        <div className="container">
            <Link to="/settings/attribute/new">
                <button type="button" className="btn btn-success">
                    Create attribute
                </button>
            </Link>
            <PagedList
                listItem={AttributeItem}
                columnNames={["Key (Label)", "Description", "URL Template"]}
                items={items
                    .slice((activePage - 1) * 10, activePage * 10)
                    .map((attribute) => ({ attribute }))}
                itemCount={items.length}
                activePage={activePage}
                filterValue={attributeFilter}
                onPageChange={(pageNumber) => setActivePage(pageNumber)}
                onFilterChange={(ev) => {
                    setAttributeFilter(ev.target.value);
                    setActivePage(1);
                }}
            />
        </div>
    );
}
