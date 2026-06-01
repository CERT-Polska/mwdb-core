import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

type Props = {
    value?: string | number;
    children?: JSX.Element;
    label: string | JSX.Element;
    tip?: string;
};

export function DetailsRecord(props: Props) {
    const value = props.value ? props.value : "never";
    return (
        <tr className="d-flex">
            <th className="col-3">
                {props.label}
                {props.tip ? (
                    <span data-toggle="tooltip" title={props.tip}>
                        <FontAwesomeIcon
                            className="ml-1 mt-1"
                            icon={faInfoCircle}
                            size="1x"
                            style={{ color: "grey" }}
                        />
                    </span>
                ) : (
                    []
                )}
            </th>
            <td className="col-9">{props.children || value}</td>
        </tr>
    );
}
