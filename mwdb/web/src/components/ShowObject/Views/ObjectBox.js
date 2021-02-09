import React, { useState } from "react";
import { useHistory } from "react-router";

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

    const tab = history.location.pathname.split("/")[3] || props.defaultTab;
    const subTab = history.location.pathname.split("/")[4];

    function getTabLink(tab, subtab) {
        let pathElements = history.location.pathname.split("/");
        let newPath = pathElements
            .slice(0, 3)
            .concat([tab])
            .concat(subtab ? [subtab] : [])
            .join("/");
        return newPath;
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
