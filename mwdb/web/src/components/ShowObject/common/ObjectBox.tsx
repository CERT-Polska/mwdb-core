import { useState } from "react";
import { useLocation } from "react-router-dom";

import { TabContext } from "@mwdb-web/commons/ui";
import { useRemotePath } from "@mwdb-web/commons/remotes";
import { useComponentState } from "@mwdb-web/commons/hooks";
import { TabContextValues } from "@mwdb-web/types/context";

type Props = {
    defaultTab: string;
    children: React.ReactNode;
};

export function ObjectBox({ defaultTab, children }: Props) {
    const remotePath = useRemotePath();
    const location = useLocation();
    const { Component, setComponent } = useComponentState();
    const [actions, setActions] = useState<JSX.Element[]>([]);
    const pathname = location.pathname.replace(remotePath, "");
    // /sample/:hash/details
    // routePath => /sample/:hash
    // tabPath => /details
    const [objectType, hash, tab, subTab] = pathname.split("/").slice(1);
    function getTabLink(tab: string, subtab?: string) {
        return [remotePath ? remotePath : "", objectType, hash, tab]
            .concat(subtab ? [subtab] : [])
            .join("/");
    }

    const values: TabContextValues = {
        tab: tab || defaultTab,
        subTab,
        getTabLink,
        setComponent,
        setActions,
    };
    return (
        <TabContext.Provider value={values}>
            <nav className="navbar navbar-expand-sm bg-white">
                <ul className="nav nav-tabs mr-auto">{children}</ul>
                <ul className="nav nav-pills ml-auto">{actions}</ul>
            </nav>
            <Component />
        </TabContext.Provider>
    );
}
