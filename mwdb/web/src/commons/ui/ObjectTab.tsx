import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { capitalize } from "../helpers";
//TODO: fix this component

export const TabContext = React.createContext({});
export const useTabContext = () => useContext(TabContext);

export function ObjectTab(props: any) {
    const context = useTabContext();

    console.log({ props, context });

    useEffect(() => {
        //@ts-ignore
        if (context.tab !== props.tab) return;
        //@ts-ignore
        context.setComponent(props.component || (() => []));
        //@ts-ignore
        context.setActions(
            //@ts-ignore
            props.actions?.map((action, index) => {
                return {
                    ...action,
                    key: index,
                };
            }) || []
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
        //@ts-ignore
    }, [context.tab]);

    return (
        <li className="nav-item">
            <Link
                to={
                    //@ts-ignore
                    context.getTabLink(props.tab)
                }
                className={`nav-link ${
                    //@ts-ignore
                    context.tab === props.tab ? "active" : ""
                }`}
            >
                {props.icon && <FontAwesomeIcon icon={props.icon} size="1x" />}
                {props.label || capitalize(props.tab)}
            </Link>
        </li>
    );
}

export function ObjectAction(props: any) {
    return (
        <li className="nav-item">
            <Link
                to={props.link ? props.link : "#"}
                className="nav-link"
                onClick={() => props.action && props.action()}
            >
                {props.icon && <FontAwesomeIcon icon={props.icon} size="1x" />}
                {capitalize(props.label)}
            </Link>
        </li>
    );
}
