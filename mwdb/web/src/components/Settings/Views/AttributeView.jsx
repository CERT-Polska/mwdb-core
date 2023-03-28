import React, { useCallback, useEffect, useState } from "react";
import { Link, Outlet, Routes, Route, useParams } from "react-router-dom";
import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/ui";

export default function AttributeView() {
    const { setAlert } = useViewAlert();
    const { attributeKey } = useParams();
    const [attribute, setAttribute] = useState({});

    async function updateAttribute() {
        try {
            let response = await api.getAttributeDefinition(attributeKey);
            setAttribute(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

    const getAttribute = useCallback(updateAttribute, [attributeKey, setAlert]);

    useEffect(() => {
        getAttribute();
    }, [getAttribute]);

    function BreadcrumbItems({ elements = [] }) {
        return [
            <li className="breadcrumb-item" key="details">
                <strong>Attribute details: </strong>
                {elements.length > 0 ? (
                    <Link to={`/settings/attribute/${attribute.key}`}>
                        {attribute.key}
                    </Link>
                ) : (
                    <span>{attribute.key}</span>
                )}
            </li>,
            ...elements.map((element, index) => (
                <li
                    key={index}
                    className={`breadcrumb-item ${
                        index === elements.length - 1 ? "active" : ""
                    }`}
                >
                    {element}
                </li>
            )),
        ];
    }

    if (!attribute) return [];
    return (
        <div className="container">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <Routes>
                        <Route index element={<BreadcrumbItems />} />
                        <Route
                            path="permissions"
                            element={
                                <BreadcrumbItems elements={["Permissions"]} />
                            }
                        />
                        <Route
                            path="edit-template"
                            element={
                                <BreadcrumbItems elements={["Edit template"]} />
                            }
                        />
                    </Routes>
                </ol>
            </nav>
            <Outlet context={{ attribute, getAttribute }} />
        </div>
    );
}
