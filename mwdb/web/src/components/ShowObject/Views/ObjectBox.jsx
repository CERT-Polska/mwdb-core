import React, { useState } from "react";
import { useLocation } from "react-router-dom";

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

export default function ObjectBox({ defaultTab, children }) {
    const location = useLocation();
    const [Component, setComponent] = useComponentState(() => []);
    const [actions, setActions] = useState([]);
    // /sample/:hash/details
    // routePath => /sample/:hash
    // tabPath => /details
    const [objectType, hash, tab, subTab] = location.pathname
        .split("/")
        .slice(1);
    function getTabLink(tab, subtab) {
        return ["", objectType, hash, tab]
            .concat(subtab ? [subtab] : [])
            .join("/");
    }

    return (
        <TabContext.Provider
            value={{
                tab: tab || defaultTab,
                subTab,
                getTabLink,
                setComponent,
                setActions,
            }}
        >
            <nav className="navbar navbar-expand-sm bg-white">
                <ul className="nav nav-tabs mr-auto">{children}</ul>
                <ul className="nav nav-pills ml-auto">{actions}</ul>
            </nav>
            <Component />
        </TabContext.Provider>
    );
}
