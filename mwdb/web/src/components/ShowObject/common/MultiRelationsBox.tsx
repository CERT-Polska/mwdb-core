import { useContext } from "react";
import { faFile, faTable, faScroll } from "@fortawesome/free-solid-svg-icons";
import { ObjectContext } from "@mwdb-web/commons/context";
import { RelationsBox } from "./RelationBox";
import { TypedRelationsBox } from "./TypedRelationsBox";

export function MultiRelationsBox() {
    const context = useContext(ObjectContext);
    const parents = context.object!.parents;
    const children = context.object!.children;
    const itemsCountPerPage = 5;

    return parents && children && parents.length + children.length > 0 ? (
        <div>
            <TypedRelationsBox
                header="Related samples"
                type="file"
                icon={faFile}
                itemsCountPerPage={itemsCountPerPage}
                {...{ parents, children }}
            />
            <TypedRelationsBox
                header="Related configs"
                type="static_config"
                icon={faTable}
                itemsCountPerPage={itemsCountPerPage}
                {...{ parents, children }}
            />
            <TypedRelationsBox
                header="Related blobs"
                type="text_blob"
                icon={faScroll}
                itemsCountPerPage={itemsCountPerPage}
                {...{ parents, children }}
            />
        </div>
    ) : (
        <RelationsBox />
    );
}
