import React, { useState } from "react";
import { useHistory } from "react-router";
import { useRouteMatch } from "react-router-dom";

import { TabContext } from "@mwdb-web/commons/ui";

function useComponentState(initialState) {
    // Functions (and components) are just called by useState and setter,
    // so we need to wrap the component with yet another function
    const [component, setComponent] = useState(() => initialState);
    return [
        component,
        (newComponent) => {
            setComponent(() => newComponent);
        },
    ];
}

export default function ObjectBox(props) {
    const history = useHistory();
    const [Component, setComponent] = useComponentState(() => []);
    const [actions, setActions] = useState([]);
    // /sample/:hash/details
    // routePath => /sample/:hash
    // tabPath => /details
    const routePath = useRouteMatch().url;
    const tabPath = history.location.pathname.slice(routePath.length);
    const tab = tabPath.split("/")[1] || props.defaultTab;
    const subTab = tabPath.split("/")[2];

    function getTabLink(tab, subtab) {
        return routePath + "/" + [tab].concat(subtab ? [subtab] : []).join("/");
    }

    const tabButtons = props.children;

    return (
        <TabContext.Provider
            value={{
                tab,
                subTab,
                getTabLink,
                setComponent,
                setActions,
            }}
        >
            <nav className="navbar navbar-expand-sm bg-white">
                <ul className="nav nav-tabs mr-auto">{tabButtons}</ul>
                <ul className="nav nav-pills ml-auto">{actions}</ul>
            </nav>
            <Component />
        </TabContext.Provider>
    );
}
