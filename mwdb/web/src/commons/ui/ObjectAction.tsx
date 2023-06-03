import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import { capitalize } from "../helpers";

type Props = {
    label: string;
    icon?: IconProp;
    action?: () => void;
    link?: string;
};

export function ObjectAction(props: Props) {
    return (
        <li className="nav-item">
            <Link
                to={props.link ? props.link : "#"}
                className="nav-link"
                onClick={() => props.action && props.action()}
            >
                {props.icon && <FontAwesomeIcon icon={props.icon} size="1x" />}
                {capitalize(props.label)}
            </Link>
        </li>
    );
}
