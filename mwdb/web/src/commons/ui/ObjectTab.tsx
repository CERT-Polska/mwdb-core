import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { capitalize } from "../helpers";
import { TabContextValues } from "@mwdb-web/types/context";
import { PreviewSwitchAction } from "@mwdb-web/components/PreviewSwitchAction";
import { NavDropdown } from "@mwdb-web/commons/ui/NavDropdown";

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
    dropdownActions?: boolean;
};

export function ObjectTab(props: Props) {
    const context: TabContextValues = useTabContext();

    useEffect(() => {
        if (context.tab !== props.tab) return;

        context.setComponent(props.component);

        const previewSwitchAction =
            props.actions?.find(
                (action) => action.type === PreviewSwitchAction
            ) || null;

        const otherActions =
            props.actions?.filter(
                (action) => action.type !== PreviewSwitchAction
            ) || [];

        const actionsArray: JSX.Element[] = [];
        if (previewSwitchAction) {
            actionsArray.push(
                <React.Fragment key="preview-switch">
                    {previewSwitchAction}
                </React.Fragment>
            );
        }
        if (otherActions.length > 0 && props.dropdownActions !== false) {
            actionsArray.push(
                <NavDropdown
                    key="nav-dropdown"
                    title="Actions"
                    position="right"
                    elements={otherActions.map((action, idx) => (
                        <React.Fragment key={`dropdown-action-${idx}`}>
                            {action}
                        </React.Fragment>
                    ))}
                />
            );
        } else if (otherActions.length > 0) {
            actionsArray.push(
                ...otherActions.map((action, idx) => (
                    <React.Fragment key={`direct-action-${idx}`}>
                        {action}
                    </React.Fragment>
                ))
            );
        }

        context.setActions(actionsArray);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context.tab, props.dropdownActions]);

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
