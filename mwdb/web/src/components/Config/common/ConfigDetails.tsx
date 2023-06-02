import { ObjectContext } from "@mwdb-web/commons/context";
import { useContext } from "react";
import { ConfigTable } from "./ConfigTable";

export function ConfigDetails() {
    const context = useContext(ObjectContext);
    return <ConfigTable object={context.object} />;
}
