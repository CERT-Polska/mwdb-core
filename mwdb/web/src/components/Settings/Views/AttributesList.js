import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "@mwdb-web/commons/api";
import { PagedList, useViewAlert } from "@mwdb-web/commons/ui";

function AttributeItem({ name, label, description, template }) {
    return (
        <tr>
            <td>
                <Link to={`/settings/attribute/${name}`}>{name}</Link>
                &nbsp;
                {label && <span>({label})</span>}
            </td>
            <td>
                {description || <div className="text-muted">(Not defined)</div>}
            </td>
            <td>
                {template || <div className="text-muted">(Not defined)</div>}
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
            const response = await api.getMetakeyDefinitions();
            setAttributes(
                response.data["metakeys"].map((attribute) => ({
                    ...attribute,
                    name: attribute.key,
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
                items={items.slice((activePage - 1) * 10, activePage * 10)}
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
