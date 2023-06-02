import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function EditButton({ onClick }: Props) {
    return (
        <button
            className="float-right align-middle btn shadow-none"
            style={{ cursor: "pointer" }}
            type="button"
            onClick={onClick}
        >
            <small className="text-muted">Edit </small>
            <FontAwesomeIcon icon={faEdit} />
        </button>
    );
}
