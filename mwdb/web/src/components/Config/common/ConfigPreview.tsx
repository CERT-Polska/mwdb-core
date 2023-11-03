import { ObjectContext } from "@mwdb-web/commons/context";
import { HexView } from "@mwdb-web/commons/ui";
import { ConfigData } from "@mwdb-web/types/types";
import { useContext } from "react";

export function ConfigPreview() {
    const context = useContext(ObjectContext);
    if (!context.object) {
        return <></>;
    }

    let cfg: ConfigData["cfg"] | undefined;

    if ("cfg" in context.object) {
        cfg = context.object.cfg;
    }

    return (
        <HexView
            content={JSON.stringify(cfg, null, 4)}
            mode="raw"
            showInvisibles={false}
            json
        />
    );
}
