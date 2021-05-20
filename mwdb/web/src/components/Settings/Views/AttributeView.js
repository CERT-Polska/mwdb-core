import React, { useCallback, useEffect, useState } from "react";
import { Link, Switch, useLocation, useParams } from "react-router-dom";
import api from "@mwdb-web/commons/api";
import { AttributeDetails } from "./AttributeDetails";
import { AdministrativeRoute, useViewAlert } from "@mwdb-web/commons/ui";
import { AttributesPermissions } from "./AttributePermissions";

export default function AttributeView() {
    const location = useLocation();
    const viewAlert = useViewAlert();
    const { metakey } = useParams();
    const [attribute, setAttribute] = useState({});

    async function updateAttribute() {
        try {
            let response = await api.getMetakeyDefinition(metakey);
            setAttribute(response.data);
        } catch (error) {
            viewAlert.setAlert({ error });
        }
    }

    const getAttribute = useCallback(updateAttribute, [metakey]);

    useEffect(() => {
        getAttribute();
    }, [getAttribute]);

    if (!attribute) return [];
    return (
        <div className="container">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <strong>Attribute details: </strong>
                        {location.pathname.split("/").length > 4 ? (
                            <Link to={`/admin/attribute/${attribute.key}`}>
                                {attribute.key}
                            </Link>
                        ) : (
                            <span>{attribute.key}</span>
                        )}
                    </li>
                    {location.pathname.split("/").length > 4 && (
                        <li className="breadcrumb-item active">
                            <Switch>
                                <AdministrativeRoute path="/admin/attribute/:metakey/permissions">
                                    Permissions
                                </AdministrativeRoute>
                            </Switch>
                        </li>
                    )}
                </ol>
            </nav>
            <Switch>
                <AdministrativeRoute exact path="/admin/attribute/:metakey">
                    <AttributeDetails
                        attribute={attribute}
                        getAttribute={updateAttribute}
                    />
                </AdministrativeRoute>
                <AdministrativeRoute
                    exact
                    path="/admin/attribute/:metakey/permissions"
                >
                    <AttributesPermissions
                        attribute={attribute}
                        getAttribute={updateAttribute}
                    />
                </AdministrativeRoute>
            </Switch>
        </div>
    );
}
