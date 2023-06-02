import { useState } from "react";
import Pagination from "react-js-pagination";
import { updateActivePage } from "@mwdb-web/commons/helpers";
import { RelationsBox } from "../common/RelationBox";
import { ObjectLegacyType, RelationItem } from "@mwdb-web/types/types";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

function paginateParentChildren(
    parents: RelationItem[],
    children: RelationItem[],
    activePage: number,
    itemsCountPerPage: number
) {
    const elementFrom = (activePage - 1) * itemsCountPerPage;
    const elementTo = activePage * itemsCountPerPage;
    const parentsFrom = elementFrom;
    const parentsTo = elementTo;
    let childrenFrom;
    let childrenTo;

    if (parents.length < elementTo) {
        childrenFrom = elementFrom - parents.length;
        if (childrenFrom < 0) {
            childrenFrom = 0;
        }
        childrenTo = elementTo - parents.length;
    } else {
        childrenFrom = 0;
        childrenTo = 0;
    }

    const selectedParents = parents.slice(parentsFrom, parentsTo);
    const selectedChildren = children.slice(childrenFrom, childrenTo);

    return [selectedParents, selectedChildren];
}

type Props = {
    parents: RelationItem[];
    children: RelationItem[];
    type: ObjectLegacyType;
    itemsCountPerPage: number;
    header: string;
    icon: IconDefinition;
};

export function TypedRelationsBox(props: Props) {
    const parentsFiltered = props.parents.filter((e) => e.type === props.type);
    const childrenFiltered = props.children.filter(
        (e) => e.type === props.type
    );

    const itemsCountPerPage = props.itemsCountPerPage;
    const [activePage, setActivePage] = useState(1);

    let [parents, children] = paginateParentChildren(
        parentsFiltered,
        childrenFiltered,
        activePage,
        itemsCountPerPage
    );

    let typedRelationsCount = parentsFiltered.length + childrenFiltered.length;

    if (typedRelationsCount > 0)
        return (
            <div>
                <RelationsBox
                    header={`${props.header}: ${typedRelationsCount}`}
                    icon={props.icon}
                    updateRelationsActivePage={() =>
                        updateActivePage(
                            activePage,
                            typedRelationsCount,
                            itemsCountPerPage,
                            setActivePage
                        )
                    }
                    {...{ parents, children }}
                />
                {typedRelationsCount > itemsCountPerPage && (
                    <Pagination
                        activePage={activePage}
                        itemsCountPerPage={itemsCountPerPage}
                        totalItemsCount={typedRelationsCount}
                        pageRangeDisplayed={5}
                        onChange={setActivePage}
                        itemClass="page-item"
                        linkClass="page-link"
                    />
                )}
            </div>
        );
    else return <div />;
}
