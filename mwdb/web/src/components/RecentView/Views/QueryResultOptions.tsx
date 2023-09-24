import { faExclamationCircle, faMagnifyingGlass, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { ButtonDropdown } from "@mwdb-web/commons/ui/ButtonDropdown";
import { ObjectType } from "@mwdb-web/types/types";
import { QueryResultHashesAction } from "../Actions/QueryResultHashesAction";
import { useContext } from "react";
import { QueryContext } from "../common/QueryContext";
import { QueryResultJsonAction } from "../Actions/QueryResultJsonAction";
import { AddTagAction } from "../Actions/QueryResultAddTagAction";
import { RemoveTagAction } from "../Actions/QueryResultRemoveTagAction";

type Props = {
    type: ObjectType,
    query: string,
    elements?: JSX.Element[],
};

export function QueryResultOptions(props: Props) {
    const { items } = useContext(QueryContext);
    return (
        <div>
            {props.query && items && items.length > 0 &&
            <div className="quick-query-bar">
                <ButtonDropdown
                    title="Result Options"
                    icon={faMagnifyingGlass}
                    elements={[
                        <QueryResultHashesAction/>, 
                        <QueryResultJsonAction/>,
                        <AddTagAction/>,
                        <RemoveTagAction/>,
                    ]}
                />
            </div>}
        </div>
    );
}