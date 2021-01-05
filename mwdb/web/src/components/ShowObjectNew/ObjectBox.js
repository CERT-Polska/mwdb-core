import React from 'react';
import { useHistory } from 'react-router';
import _ from "lodash";

export default function ObjectBox(props) {
    const history = useHistory();

    const currentTab = history.location.pathname.split("/")[3] || props.defaultTab;
    const currentSubTab = history.location.pathname.split("/")[4];
    
    function getTabLink(tab, subtab) {
        let pathElements = history.location.pathname.split("/");
        let newPath = pathElements.slice(0, 3).concat([tab]).concat(subtab ? [subtab] : []).join("/");
        return newPath
    }

    const tabButtons = props.children;
    const tabs = _.fromPairs(
        React.Children.toArray(props.children).map(
            objectTab => [objectTab.props.tab, objectTab]
        )
    )
    const actions = (
        tabs[currentTab] &&
        tabs[currentTab].props.actions
    ) || [];
    const TabPresenter = (
        tabs[currentTab] &&
        tabs[currentTab].props.component
    ) || (() => []);

    return (
        <TabContext.Provider value={{
            currentTab,
            currentSubTab,
            getTabLink
        }}>
            <nav className="navbar navbar-expand-sm bg-white">
                 <ul className="nav nav-tabs mr-auto">
                    {tabButtons}
                </ul>
                <ul className="nav nav-pills ml-auto">
                    {actions}
                </ul>
            </nav>
            <TabPresenter />
        </TabContext.Provider>
    )
}
