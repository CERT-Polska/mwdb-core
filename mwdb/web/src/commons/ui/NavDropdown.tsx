import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

type Props = {
    title?: string;
    icon?: IconProp;
    elements: JSX.Element[];
    badge?: string;
};

export function NavDropdown(props: Props) {
    if (!props.elements.length) return <div />;
    return (
        <div className="nav-item dropdown">
            <a
                className="nav-link dropdown-toggle"
                href="#dropdown"
                role="button"
                data-toggle="dropdown"
            >
                {props.icon && (
                    <FontAwesomeIcon
                        className="navbar-icon"
                        icon={props.icon}
                    />
                )}
                {props.title}
                {props.badge && (
                    <span
                        className="badge badge-pill badge-warning"
                        style={{ marginLeft: "8px" }}
                    >
                        {props.badge}
                    </span>
                )}
            </a>
            <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                {props.elements}
            </div>
        </div>
    );
}
