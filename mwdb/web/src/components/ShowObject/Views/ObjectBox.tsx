import { useState } from "react";
import { useLocation } from "react-router-dom";

import { TabContext } from "@mwdb-web/commons/ui";
import { useRemotePath } from "@mwdb-web/commons/remotes";

//TODO: fix this component
export type TabContextValues<T> = {
    tab?: string;
    subTab?: string;
    getTabLink: (tab: string, subtab: string) => string;
    setComponent: (value: any) => void;
};

function useComponentState(initialState: any) {
    // Functions (and components) are just called by useState and setter,
    // so we need to wrap the component with yet another function
    const [component, setComponent] = useState(() => initialState);
    console.log({ component });
    return [
        component,
        (newComponent: any) => {
            setComponent(() => newComponent);
        },
    ];
}

export default function ObjectBox<T>({ defaultTab, children }: any) {
    const remotePath = useRemotePath();
    const location = useLocation();
    const [Component, setComponent] = useComponentState(() => []);
    const [actions, setActions] = useState([]);
    const pathname = location.pathname.replace(remotePath, "");
    // /sample/:hash/details
    // routePath => /sample/:hash
    // tabPath => /details
    const [objectType, hash, tab, subTab] = pathname.split("/").slice(1);
    function getTabLink(tab: string, subtab: string) {
        return [remotePath ? remotePath : "", objectType, hash, tab]
            .concat(subtab ? [subtab] : [])
            .join("/");
    }

    console.log({ objectType, hash, tab, subTab });
    const values: TabContextValues<T> = {
        tab: tab || defaultTab,
        subTab,
        getTabLink,
        //@ts-ignore
        setComponent,
        //@ts-ignore
        setActions,
    };
    return (
        <TabContext.Provider value={values}>
            <nav className="navbar navbar-expand-sm bg-white">
                <ul className="nav nav-tabs mr-auto">{children}</ul>
                <ul className="nav nav-pills ml-auto">{actions}</ul>
            </nav>
            {/*  @ts-ignore */}
            <Component />
        </TabContext.Provider>
    );
}
