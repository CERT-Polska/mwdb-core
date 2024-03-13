import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

type Props = {
    title?: string;
    color?: string;
    icon?: IconProp;
    elements: JSX.Element[];
};

export function ButtonDropdown(props: Props) {
    if (!props.elements.length) return <div />;
    return (
        <div className="nav-item dropdown">
            <button
                className={`btn btn-${props.color ? props.color : "info"} dropdown-toggle py-0`}
                data-toggle="dropdown"
            >
                {props.icon ? (
                    <FontAwesomeIcon
                        className="navbar-icon"
                        icon={props.icon}
                    />
                ) : (
                    []
                )}
                {props.title}
            </button>
            <ul className="dropdown-menu button-menu" aria-labelledby="buttonDropdown">
                {props.elements}
            </ul>
        </div>
    );
}
