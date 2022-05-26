import React, { useContext } from "react";

import { useSearchParams } from "react-router-dom-v5-compat";

import { faProjectDiagram, faSearch } from "@fortawesome/free-solid-svg-icons";

import RelationsPlot from "../../RelationsPlot";

import { ObjectContext } from "@mwdb-web/commons/context";
import { ObjectAction, ObjectTab } from "@mwdb-web/commons/ui";

export default function RelationsTab() {
    const context = useContext(ObjectContext);
    const searchParams = useSearchParams()[0];
    const nodes = searchParams.getAll("node") || [];
    const zoomLink =
        "/relations?node=" + [context.object.id, ...nodes].join("&node=");

    return (
        <ObjectTab
            tab="relations"
            icon={faProjectDiagram}
            actions={[
                <ObjectAction label="Zoom" icon={faSearch} link={zoomLink} />,
            ]}
            component={() => (
                <RelationsPlot hash={context.object.id} height="600" />
            )}
        />
    );
}
