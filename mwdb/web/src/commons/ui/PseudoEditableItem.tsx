import { Link } from "react-router-dom";

import { EditButton } from "./EditButton";

type Props = {
    children: React.ReactNode;
    editLocation: string;
};

export function PseudoEditableItem({ children, editLocation }: Props) {
    /*
     Looks the same as regular editable item, but Edit button redirects to the
     separate editing view
     */
    return (
        <div>
            <span className="align-middle">{children}</span>
            <Link to={editLocation}>
                <EditButton />
            </Link>
        </div>
    );
}
