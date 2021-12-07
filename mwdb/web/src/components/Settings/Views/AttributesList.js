import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { PagedList, useViewAlert } from "@mwdb-web/commons/ui";

function AttributeItem({ attribute }) {
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

export default function AttributesList() {
    const { setAlert } = useViewAlert();
    const [attributes, setAttributes] = useState([]);
    const [activePage, setActivePage] = useState(1);
    const [attributeFilter, setAttributeFilter] = useState("");

    async function updateAttributes() {
        try {
            const response = await api.getAttributeDefinitions("manage");
            setAttributes(
                response.data["attribute_definitions"].map((attribute) => ({
                    ...attribute,
                }))
            );
        } catch (error) {
            setAlert({ error });
        }
    }

    const getAttributes = useCallback(updateAttributes, [setAlert]);

    useEffect(() => {
        getAttributes();
    }, [getAttributes]);

    const query = attributeFilter.toLowerCase();
    const items = attributes
        .filter((attribute) => attribute.key.toLowerCase().includes(query))
        .sort((attrA, attrB) => attrA.key.localeCompare(attrB.key));

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
