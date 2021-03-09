import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function NavDropdown(props) {
    if (!props.elements.length) return <div />;
    return (
        <li className="nav-item dropdown">
            <a
                className="nav-link dropdown-toggle"
                href="#dropdown"
                role="button"
                data-toggle="dropdown"
            >
                <FontAwesomeIcon className="navbar-icon" icon={props.icon} />
                {props.title}
                {props.badge ? (
                    <span
                        className="badge badge-pill badge-warning"
                        style={{ marginLeft: "8px" }}
                    >
                        {props.badge}
                    </span>
                ) : (
                    []
                )}
            </a>
            <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                {props.elements}
            </div>
        </li>
    );
}
