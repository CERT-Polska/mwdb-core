import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

type Props = {
    label: string;
    color: string;
    onClick: (ev: React.MouseEvent) => void;
    onDelete?: (ev: React.MouseEvent) => void;
};

export function QuickQueryItem(props: Props) {
    return (
        <span
            className={`badge badge-${props.color}`}
            style={{ cursor: "pointer" }}
        >
            <span
                data-toggle="tooltip"
                title="Add the Quick query to your search or click on x to delete it"
                onClick={props.onClick}
            >
                {props.label}{" "}
            </span>
            {props.onDelete ? (
                <span
                    data-toggle="tooltip"
                    title="Delete Quick query."
                    onClick={props.onDelete}
                >
                    <FontAwesomeIcon icon={faTimes} pull="right" size="1x" />
                </span>
            ) : (
                []
            )}
        </span>
    );
}
