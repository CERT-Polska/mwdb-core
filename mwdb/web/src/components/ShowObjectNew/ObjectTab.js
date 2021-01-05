import React, { useContext } from 'react';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { capitalize } from '@mwdb-web/commons/helpers';

export const TabContext = React.createContext();
export const useTabContext = () => useContext(TabContext);

export function ObjectTab(props) {
    const context = useTabContext();

    return ( 
        <li className="nav-item">
            <Link to={context.getTabLink(props.tab)}
                  className={`nav-link ${context.currentTab === props.tab ? "active" : ""}`}>
                { props.icon ? <FontAwesomeIcon icon={props.icon} size="1x"/> : [] }
                { props.label || capitalize(props.tab) }
            </Link>
        </li>
    )
}

export function ObjectAction(props) {
    return (
        <li className="nav-item">
            <Link to={props.link ? props.link : "#"}
                  className="nav-link" 
                  onClick={() => props.action && props.action()}>
                { props.icon ? <FontAwesomeIcon icon={props.icon} size="1x"/> : [] }
                { capitalize(props.label) }
            </Link>
        </li>
    )
}
