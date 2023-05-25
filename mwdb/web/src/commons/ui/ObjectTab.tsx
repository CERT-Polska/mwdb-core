import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalize } from "../helpers";
import { TabContextValues } from "@mwdb-web/types/context";

export const TabContext = React.createContext<TabContextValues>(
    {} as TabContextValues
);
export const useTabContext = () => useContext(TabContext);

type Props = {
    actions?: JSX.Element[];
    component: React.ComponentType;
    icon?: IconProp;
    tab: string;
    label?: string | JSX.Element;
};

export function ObjectTab(props: Props) {
    const context: TabContextValues = useTabContext();

    useEffect(() => {
        if (context.tab !== props.tab) return;
        context.setComponent(props.component);
        context.setActions(
            props.actions?.map((action, index) => {
                return {
                    ...action,
                    key: index,
                };
            }) || []
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context.tab]);

    return (
        <li className="nav-item">
            <Link
                to={context.getTabLink(props.tab)}
                className={`nav-link ${
                    context.tab === props.tab ? "active" : ""
                }`}
            >
                {props.icon && <FontAwesomeIcon icon={props.icon} size="1x" />}
                {props.label || capitalize(props.tab)}
            </Link>
        </li>
    );
}
