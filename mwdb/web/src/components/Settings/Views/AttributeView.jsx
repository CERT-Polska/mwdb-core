import { useEffect, useState } from "react";
import { Link, Outlet, Routes, Route, useParams } from "react-router-dom";
import { isEmpty } from "lodash";
import { api } from "@mwdb-web/commons/api";
import { useViewAlert } from "@mwdb-web/commons/hooks";

export default function AttributeView() {
    const { setAlert } = useViewAlert();
    const { attributeKey } = useParams();
    const [attribute, setAttribute] = useState({});

    useEffect(() => {
        getAttribute();
    }, [attributeKey]);

    async function getAttribute() {
        try {
            let response = await api.getAttributeDefinition(attributeKey);
            setAttribute(response.data);
        } catch (error) {
            setAlert({ error });
        }
    }

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

    if (isEmpty(attribute)) return <></>;

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
